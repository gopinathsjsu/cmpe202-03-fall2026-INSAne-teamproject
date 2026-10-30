import { useEffect, useRef, useState } from "react";

import {
  MAP_ID,
  getPropertyPosition,
  importGoogleLibrary,
  isGoogleMapsEnabled,
} from "../services/googleMaps";

// Public coordinates are rounded to about 1 km,
// so the listing map shows a circle this size.
const APPROXIMATE_RADIUS_METERS = 800;

const SINGLE_PROPERTY_ZOOM = 14;

function formatMarkerPrice(price) {
  return Number(price || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

// ==========================================
// PROPERTY MAP
// Shows properties on a Google Map.
// - approximate: draw an area circle instead
//   of a pin (for a single listing's page)
// - onSelect: called when a pin is clicked
// Renders nothing without a key or coordinates.
// ==========================================
export default function PropertyMap({
  properties,
  approximate = false,
  onSelect,
  className = "property-map",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef([]);
  const onSelectRef = useRef(onSelect);

  const [error, setError] = useState("");

  // Keep the latest callback without
  // rebuilding markers on every render.
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const mappable = properties.filter((property) =>
    getPropertyPosition(property)
  );

  // Rebuild overlays only when the set of
  // mapped properties or positions changes.
  const mappableKey = mappable
    .map((property) => {
      const { lat, lng } = getPropertyPosition(property);
      return `${property.id}:${lat}:${lng}:${property.price_per_night}`;
    })
    .join("|");

  const shouldRender =
    isGoogleMapsEnabled() && mappable.length > 0;

  useEffect(() => {
    if (!shouldRender || error) {
      // The map container is unmounted, so a
      // new map must be created next time.
      mapRef.current = null;
      overlaysRef.current = [];
      return;
    }

    let cancelled = false;

    async function drawMap() {
      try {
        const [{ Map, Circle }, { AdvancedMarkerElement }] =
          await Promise.all([
            importGoogleLibrary("maps"),
            importGoogleLibrary("marker"),
          ]);

        const { LatLngBounds } =
          await importGoogleLibrary("core");

        if (cancelled || !containerRef.current) {
          return;
        }

        if (!mapRef.current) {
          mapRef.current = new Map(containerRef.current, {
            mapId: MAP_ID,
            center: getPropertyPosition(mappable[0]),
            zoom: SINGLE_PROPERTY_ZOOM,
            streetViewControl: false,
            mapTypeControl: false,
          });
        }

        const map = mapRef.current;

        overlaysRef.current.forEach((overlay) => {
          overlay.map = null;

          if (overlay.setMap) {
            overlay.setMap(null);
          }
        });

        overlaysRef.current = mappable.map((property) => {
          const position = getPropertyPosition(property);

          if (approximate) {
            return new Circle({
              map,
              center: position,
              radius: APPROXIMATE_RADIUS_METERS,
              strokeColor: "#ff385c",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: "#ff385c",
              fillOpacity: 0.15,
            });
          }

          const pin = document.createElement("div");
          pin.className = "map-price-marker";
          pin.textContent = formatMarkerPrice(
            property.price_per_night
          );

          const marker = new AdvancedMarkerElement({
            map,
            position,
            content: pin,
            title: property.title,
            gmpClickable: true,
          });

          marker.addListener("gmp-click", () => {
            onSelectRef.current?.(property);
          });

          return marker;
        });

        if (mappable.length === 1) {
          map.setCenter(getPropertyPosition(mappable[0]));
          map.setZoom(SINGLE_PROPERTY_ZOOM);
        } else {
          const bounds = new LatLngBounds();

          mappable.forEach((property) =>
            bounds.extend(getPropertyPosition(property))
          );

          map.fitBounds(bounds, 48);
        }

        setError("");

      } catch (err) {
        if (!cancelled) {
          console.error("Map error:", err);
          setError("Map could not be loaded.");
        }
      }
    }

    drawMap();

    return () => {
      cancelled = true;
    };

    // mappableKey captures the relevant
    // contents of mappable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRender, error, mappableKey, approximate]);

  if (!shouldRender) {
    return null;
  }

  if (error) {
    return <p className="map-error">{error}</p>;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      role="region"
      aria-label={
        approximate
          ? "Map of the approximate property location"
          : "Map of search results"
      }
    />
  );
}
