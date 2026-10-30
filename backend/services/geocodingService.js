// ==========================================
// GOOGLE GEOCODING SERVICE
// Converts a property address into coordinates.
// All Google calls for location live in this file.
// ==========================================

const GEOCODE_URL =
  "https://maps.googleapis.com/maps/api/geocode/json";

// Google should answer well within this limit.
const REQUEST_TIMEOUT_MS = 5000;

let warnedMissingKey = false;

const isGeocodingEnabled = () =>
  Boolean(process.env.GOOGLE_MAPS_SERVER_KEY);

// Build one address string from the property fields.
// Returns null when there is nothing to look up.
function buildAddressQuery({
  address,
  city,
  state,
  zipCode,
}) {
  const parts = [address, city, state, zipCode]
    .map((part) =>
      typeof part === "string" ? part.trim() : ""
    )
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

// ==========================================
// GEOCODE ADDRESS
// Resolves to { latitude, longitude } or null.
// Never throws: a failed lookup must not block
// a host from saving a listing.
// ==========================================
async function geocodeAddress(location) {
  const query = buildAddressQuery(location);

  if (!query) {
    return null;
  }

  if (!isGeocodingEnabled()) {
    if (!warnedMissingKey) {
      console.warn(
        "GOOGLE_MAPS_SERVER_KEY is not set; skipping geocoding."
      );
      warnedMissingKey = true;
    }

    return null;
  }

  const params = new URLSearchParams({
    address: query,
    components: "country:US",
    key: process.env.GOOGLE_MAPS_SERVER_KEY,
  });

  try {
    const response = await fetch(
      `${GEOCODE_URL}?${params}`,
      {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      console.error(
        "Geocoding HTTP error:",
        response.status
      );
      return null;
    }

    const data = await response.json();

    if (data.status === "ZERO_RESULTS") {
      return null;
    }

    if (data.status !== "OK") {
      console.error(
        "Geocoding error:",
        data.status,
        data.error_message || ""
      );
      return null;
    }

    const { lat, lng } =
      data.results?.[0]?.geometry?.location || {};

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return null;
    }

    return { latitude: lat, longitude: lng };

  } catch (error) {
    console.error("Geocoding request failed:", error.message);
    return null;
  }
}

module.exports = {
  buildAddressQuery,
  geocodeAddress,
  isGeocodingEnabled,
};
