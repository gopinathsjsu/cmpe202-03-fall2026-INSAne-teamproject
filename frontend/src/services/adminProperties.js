import { getAuthToken } from "./auth";

const API_URL = "http://localhost:5001/api/admin";
const PROPERTIES_URL =
  "http://localhost:5001/api/properties";

// ==========================================
// AUTHENTICATED ADMIN REQUEST
// ==========================================
async function adminRequest(path, options = {}) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Please log in as an admin.");
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to the backend on port 5001."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Admin request failed."
    );
  }

  return data;
}

// ==========================================
// EXTRACT LIST OF PROPERTIES
// ==========================================
function extractProperties(data) {
  if (Array.isArray(data)) return data;

  const properties =
    data.properties ??
    data.pendingProperties ??
    data.listings;

  if (!Array.isArray(properties)) {
    throw new Error(
      "Unexpected property response from backend."
    );
  }

  return properties;
}

// ==========================================
// GET PENDING PROPERTIES
// ==========================================
export async function getPendingProperties() {
  const data = await adminRequest("/properties/pending");

  return extractProperties(data);
}

// ==========================================
// GET APPROVED PROPERTIES
// ==========================================
export async function getApprovedProperties() {
  let response;

  try {
    response = await fetch(PROPERTIES_URL);
  } catch {
    throw new Error(
      "Cannot connect to the backend on port 5001."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to retrieve approved properties."
    );
  }

  return extractProperties(data);
}

// ==========================================
// APPROVE PROPERTY
// ==========================================
export async function approveProperty(id) {
  return adminRequest(
    `/properties/${encodeURIComponent(id)}/approve`,
    { method: "PATCH" }
  );
}

// ==========================================
// REJECT PROPERTY
// ==========================================
export async function rejectProperty(id) {
  return adminRequest(
    `/properties/${encodeURIComponent(id)}/reject`,
    { method: "PATCH" }
  );
}
