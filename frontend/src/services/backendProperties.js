const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:5001"
}/api/properties`;

// ==========================================
// GET APPROVED PROPERTY BY ID
// ==========================================
export async function getBackendPropertyById(id) {
  let response;

  try {
    response = await fetch(
      `${API_URL}/${encodeURIComponent(id)}`
    );
  } catch {
    throw new Error(
      "Cannot connect to the backend. Make sure it is running on port 5001."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to retrieve property."
    );
  }

  // Support a response wrapped in { property: ... }
  // or a direct property object.
  const property = data.property || data;

  if (!property || !property.id) {
    throw new Error("Invalid property data received.");
  }

  return property;
}

// ==========================================
// GET ALL APPROVED PROPERTIES
// Pass { latitude, longitude, radiusMiles }
// to get only nearby properties, nearest first.
// ==========================================
export async function getBackendProperties(nearby) {
  let response;

  const url = nearby
    ? `${API_URL}?${new URLSearchParams({
        lat: String(nearby.latitude),
        lng: String(nearby.longitude),
        radius: String(nearby.radiusMiles),
      })}`
    : API_URL;

  try {
    response = await fetch(url);
  } catch {
    throw new Error("Failed to connect to the backend.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to retrieve properties."
    );
  }

  return Array.isArray(data)
    ? data
    : data.properties || [];
}
