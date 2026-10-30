// ==========================================
// GOOGLE MAPS JAVASCRIPT API LOADER
// Loads Google's script once, on first use.
// Without a key, maps and autocomplete are
// hidden and the app works as before.
// ==========================================

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;

// Advanced markers require a map ID.
// DEMO_MAP_ID works for development.
export const MAP_ID =
  import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

const CALLBACK_NAME = "__insaneStaysMapsReady";

let loadPromise = null;

export function isGoogleMapsEnabled() {
  return Boolean(API_KEY);
}

function loadGoogleMaps() {
  if (!isGoogleMapsEnabled()) {
    return Promise.reject(
      new Error("Google Maps API key is not configured.")
    );
  }

  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google.maps);
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      window[CALLBACK_NAME] = () => {
        delete window[CALLBACK_NAME];
        resolve(window.google.maps);
      };

      const params = new URLSearchParams({
        key: API_KEY,
        v: "weekly",
        loading: "async",
        callback: CALLBACK_NAME,
      });

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      script.async = true;

      script.onerror = () => {
        // Allow a later retry.
        loadPromise = null;
        reject(new Error("Failed to load Google Maps."));
      };

      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

// ==========================================
// IMPORT A GOOGLE MAPS LIBRARY
// e.g. "maps", "marker", "places"
// ==========================================
export async function importGoogleLibrary(name) {
  const maps = await loadGoogleMaps();
  return maps.importLibrary(name);
}

// ==========================================
// GET COORDINATES FROM A PROPERTY
// Returns { lat, lng } or null.
// ==========================================
export function getPropertyPosition(property) {
  const lat = Number(property?.latitude);
  const lng = Number(property?.longitude);

  if (
    property?.latitude === null ||
    property?.latitude === undefined ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return { lat, lng };
}
