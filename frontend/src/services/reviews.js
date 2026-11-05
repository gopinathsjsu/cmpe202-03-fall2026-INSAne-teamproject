const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5001"
).replace(/\/+$/, "");

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed: ${response.status}`
    );
  }

  return data;
}

// Public: get reviews and rating for a property
export async function getPropertyReviews(propertyId) {
  const response = await fetch(
    `${BASE_URL}/api/properties/${encodeURIComponent(propertyId)}/reviews`
  );

  return handleResponse(response);
}

// Customer: get their previously submitted reviews
export async function getMyReviews(token) {
  const response = await fetch(`${BASE_URL}/api/reviews/mine`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
}

// Customer: submit a new review
export async function createReview({
  token,
  bookingId,
  rating,
  comment,
}) {
  const response = await fetch(`${BASE_URL}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bookingId,
      rating,
      comment,
    }),
  });

  return handleResponse(response);
}
