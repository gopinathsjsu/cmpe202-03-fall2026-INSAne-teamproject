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
// For upcoming homepage integration
// ==========================================
export async function getBackendProperties() {
  let response;

  try {
    response = await fetch(API_URL);
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
