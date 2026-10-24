import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ReviewForm from "../components/ReviewForm.jsx";

import {
  getMyBookings,
  cancelCustomerBooking,
} from "../services/bookings";

const REVIEWS_KEY = "staynest_reviews";

// ==========================================
// HELPER: GET TODAY
// ==========================================
function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ==========================================
// HELPER: READ LOCAL REVIEWS
// Reviews will get a backend API later
// ==========================================
function readReviews() {
  try {
    const data = JSON.parse(
      localStorage.getItem(REVIEWS_KEY) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ==========================================
// HELPER: FORMAT BOOKING DATES
// ==========================================
function formatDate(value) {
  if (!value) return "N/A";

  const dateString = String(value).slice(0, 10);

  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ==========================================
// HELPER: CALCULATE NIGHTS
// ==========================================
function calculateNights(checkIn, checkOut) {
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }

  return Math.round((end - start) / 86400000);
}

// ==========================================
// HELPER: FORMAT CURRENCY
// ==========================================
function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

// ==========================================
// HELPER: NORMALIZE BACKEND BOOKING
// ==========================================
function normalizeBooking(booking) {
  const checkIn = String(booking.check_in).slice(0, 10);
  const checkOut = String(booking.check_out).slice(0, 10);

  return {
    id: String(booking.id),
    userId: String(booking.user_id),
    propertyId: String(booking.property_id),

    propertyTitle: booking.property_title,
    city: booking.city,
    state: booking.state,
    image: booking.image_url,

    checkIn,
    checkOut,

    guests: Number(booking.guests),
    nights: calculateNights(checkIn, checkOut),
    total: Number(booking.total_price),

    status: booking.status,
    createdAt: booking.created_at,
  };
}

// ==========================================
// MY BOOKINGS PAGE
// ==========================================
export default function MyBookings({ user }) {
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState(readReviews);

  const [filter, setFilter] = useState("all");
  const [reviewBookingId, setReviewBookingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const today = getToday();

  // ==========================================
  // LOAD BOOKINGS FROM POSTGRESQL
  // ==========================================
  useEffect(() => {
    let active = true;

    async function loadBookings() {
      setLoading(true);
      setError("");

      try {
        const data = await getMyBookings();

        if (active) {
          setBookings(data.map(normalizeBooking));
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load bookings.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      active = false;
    };
  }, [user?.id]);

  // ==========================================
  // FILTER BOOKINGS
  // ==========================================
  const visibleBookings = bookings.filter((booking) => {
    if (filter === "upcoming") {
      return (
        booking.status === "confirmed" &&
        booking.checkIn >= today
      );
    }

    if (filter === "past") {
      return (
        booking.status === "confirmed" &&
        booking.checkOut <= today
      );
    }

    if (filter === "cancelled") {
      return booking.status === "cancelled";
    }

    return true;
  });

  // ==========================================
  // CANCEL BOOKING THROUGH BACKEND
  // ==========================================
  async function handleCancelBooking(bookingId) {
    if (cancellingId !== null) return;

    const booking = bookings.find(
      (item) => item.id === String(bookingId)
    );

    if (
      !booking ||
      booking.status !== "confirmed" ||
      booking.checkIn < getToday()
    ) {
      setMessage("This booking can no longer be cancelled.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setCancellingId(bookingId);

    try {
      await cancelCustomerBooking(bookingId);

      // Update UI only after PostgreSQL confirms cancellation
      setBookings((previous) =>
        previous.map((item) =>
          item.id === String(bookingId)
            ? { ...item, status: "cancelled" }
            : item
        )
      );

      setReviewBookingId(null);

      setMessage(
        "Your reservation has been cancelled successfully."
      );
    } catch (err) {
      setError(err.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  }

  // ==========================================
  // SUBMIT REVIEW (LOCAL PROTOTYPE)
  // ==========================================
  function submitReview(data) {
    const booking = bookings.find(
      (item) =>
        item.id === String(data.bookingId) &&
        item.userId === String(user.id) &&
        item.propertyId === String(data.propertyId)
    );

    if (
      !booking ||
      booking.status !== "confirmed" ||
      booking.checkOut > getToday()
    ) {
      setMessage("Only completed stays can be reviewed.");
      return;
    }

    const alreadyReviewed = reviews.some(
      (review) =>
        String(review.bookingId) === booking.id
    );

    if (alreadyReviewed) {
      setMessage("You have already reviewed this booking.");
      return;
    }

    if (
      !Number.isInteger(data.rating) ||
      data.rating < 1 ||
      data.rating > 5 ||
      typeof data.comment !== "string" ||
      data.comment.trim().length < 10
    ) {
      setMessage("Please provide a valid rating and review.");
      return;
    }

    const newReview = {
      id: crypto.randomUUID(),
      bookingId: booking.id,
      propertyId: booking.propertyId,
      userId: String(user.id),
      userName: user.name,
      rating: data.rating,
      comment: data.comment.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedReviews = [...reviews, newReview];

    localStorage.setItem(
      REVIEWS_KEY,
      JSON.stringify(updatedReviews)
    );

    setReviews(updatedReviews);
    setReviewBookingId(null);

    setMessage(
      "Review saved locally. Backend review integration is pending."
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <main className="bookings-page">

      {/* PAGE HEADER */}
      <div className="bookings-header">
        <h1>My Bookings</h1>

        <p>
          View and manage your vacation rental reservations.
        </p>
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="booking-notice" role="status">
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {/* BOOKING FILTERS */}
      <div className="booking-filters">
        {["all", "upcoming", "past", "cancelled"].map(
          (option) => (
            <button
              type="button"
              key={option}
              className={
                filter === option ? "active" : ""
              }
              onClick={() => setFilter(option)}
            >
              {option.charAt(0).toUpperCase() +
                option.slice(1)}
            </button>
          )
        )}
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="empty-bookings" role="status">
          <h2>Loading bookings...</h2>
          <p>Retrieving your reservations.</p>
        </div>
      ) : error && bookings.length === 0 ? (
        <div className="empty-bookings">
          <h2>Unable to load bookings</h2>
          <p>Please check your connection and try again.</p>
        </div>
      ) : visibleBookings.length === 0 ? (

        /* EMPTY STATE */
        <div className="empty-bookings">
          <h2>No bookings found</h2>

          <p>
            {filter === "all"
              ? "Your reservations will appear here once you book a stay."
              : `You have no ${filter} bookings.`}
          </p>

          <Link to="/" className="primary-btn">
            Explore stays
          </Link>
        </div>
      ) : (

        /* BOOKING LIST */
        <div className="booking-list">
          {visibleBookings.map((booking) => {
            const canCancel =
              booking.status === "confirmed" &&
              booking.checkIn >= today;

            const canReview =
              booking.status === "confirmed" &&
              booking.checkOut <= today;

            const existingReview = reviews.find(
              (review) =>
                String(review.bookingId) === booking.id
            );

            return (
              <article
                className="booking-card"
                key={booking.id}
              >

                {/* PROPERTY IMAGE */}
                {booking.image && (
                  <img
                    src={booking.image}
                    alt={booking.propertyTitle}
                    className="booking-card-image"
                  />
                )}

                <div className="booking-card-content">

                  {/* PROPERTY NAME AND STATUS */}
                  <div className="booking-card-top">
                    <h2>{booking.propertyTitle}</h2>

                    <span
                      className={`booking-status ${booking.status}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {/* PROPERTY LOCATION */}
                  <p>
                    {booking.city}, {booking.state}
                  </p>

                  {/* BOOKING DATES */}
                  <p>
                    {formatDate(booking.checkIn)} –{" "}
                    {formatDate(booking.checkOut)}
                  </p>

                  {/* GUEST COUNT AND NIGHTS */}
                  <p>
                    {booking.guests}{" "}
                    {booking.guests === 1
                      ? "guest"
                      : "guests"}
                    {" · "}
                    {booking.nights}{" "}
                    {booking.nights === 1
                      ? "night"
                      : "nights"}
                  </p>

                  {/* TOTAL PRICE */}
                  <p className="booking-total">
                    Total: {formatMoney(booking.total)}
                  </p>

                  {/* BOOKING ACTIONS */}
                  <div className="booking-actions">

                    <Link
                      to={`/properties/${booking.propertyId}`}
                    >
                      View property
                    </Link>

                    {canCancel && (
                      <button
                        type="button"
                        className="cancel-booking-btn"
                        disabled={
                          cancellingId !== null
                        }
                        onClick={() =>
                          handleCancelBooking(booking.id)
                        }
                      >
                        {cancellingId === booking.id
                          ? "Cancelling..."
                          : "Cancel booking"}
                      </button>
                    )}

                    {canReview && !existingReview && (
                      <button
                        type="button"
                        className="write-review-btn"
                        onClick={() => {
                          setReviewBookingId(booking.id);
                          setMessage("");
                        }}
                      >
                        Write a review
                      </button>
                    )}

                  </div>

                  {/* EXISTING REVIEW */}
                  {existingReview && (
                    <div className="submitted-review">
                      <strong>Your review</strong>

                      <p className="submitted-stars">
                        {"★".repeat(existingReview.rating)}
                        {"☆".repeat(
                          5 - existingReview.rating
                        )}
                      </p>

                      <p>{existingReview.comment}</p>
                      <small>
                        Saved locally in this browser
                      </small>
                    </div>
                  )}

                  {/* REVIEW FORM */}
                  {reviewBookingId === booking.id &&
                    canReview &&
                    !existingReview && (
                      <ReviewForm
                        booking={booking}
                        onSubmit={submitReview}
                        onCancel={() =>
                          setReviewBookingId(null)
                        }
                      />
                    )}

                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
