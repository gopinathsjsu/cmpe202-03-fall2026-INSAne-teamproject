import { getAuthToken } from "./auth";

const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001"
).replace(/\/+$/, "");

const API_URL = `${BASE_URL}/api/bookings`;

// ==========================================
// HELPER: Send authenticated requests
// ==========================================
async function bookingRequest(path, options = {}) {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Please log in to manage your bookings.");
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
      "Cannot connect to the backend. Make sure the server is running on port 5001."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Booking request failed."
    );
  }

  return data;
}

// ==========================================
// GET CUSTOMER BOOKINGS
// ==========================================
export async function getMyBookings() {
  const data = await bookingRequest("/mine");
  return data.bookings || [];
}

// ==========================================
// CANCEL CUSTOMER BOOKING
// ==========================================
export async function cancelCustomerBooking(bookingId) {
  return bookingRequest(`/${bookingId}/cancel`, {
    method: "PATCH",
  });
}

// ==========================================
// CREATE CUSTOMER BOOKING
// For future PropertyDetails integration
// ==========================================
export async function createBooking(bookingData) {
  return bookingRequest("", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });
}

// ==========================================
// GET HOST BOOKINGS
// For future HostBookings integration
// ==========================================
export async function getHostBookings() {
  const data = await bookingRequest("/host");
  return data.bookings || [];
}
