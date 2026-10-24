import { getAuthToken } from "./auth";

const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001"
).replace(/\/+$/, "");

const API_URL = `${BASE_URL}/api/properties`;
// ==========================================
// HELPER: AUTHENTICATED API REQUEST
// ==========================================
async function hostRequest(path, options = {}) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Please log in as a host.");
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to the backend. Make sure it is running on port 5001."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Property request failed."
    );
  }

  return data;
}

// ==========================================
// GET HOST'S PROPERTIES
// ==========================================
export async function getMyHostProperties() {
  const data = await hostRequest("/mine");

  return data.properties || [];
}

// ==========================================
// CREATE PROPERTY
// ==========================================
export async function createHostProperty(propertyData) {
  return hostRequest("", {
    method: "POST",
    body: JSON.stringify(propertyData),
  });
}

// ==========================================
// UPDATE PROPERTY
// ==========================================
export async function updateHostProperty(id, propertyData) {
  return hostRequest(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(propertyData),
  });
}

// ==========================================
// DELETE PROPERTY
// ==========================================
export async function deleteHostProperty(id) {
  return hostRequest(`/${id}`, {
    method: "DELETE",
  });
}
