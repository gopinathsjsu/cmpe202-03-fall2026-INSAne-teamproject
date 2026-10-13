
import { useState } from "react";
import { Link } from "react-router-dom";
import { properties } from "../data/properties";
import ReviewForm from "../components/ReviewForm.jsx";

const BOOKINGS_KEY = "staynest_bookings";
const REVIEWS_KEY = "staynest_reviews";

// Get today's date in YYYY-MM-DD format
function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Read mock data from localStorage
function readStorage(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Format booking dates
function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MyBookings({ user }) {
  const [bookings, setBookings] = useState(() =>
    readStorage(BOOKINGS_KEY)
  );

  const [reviews, setReviews] = useState(() =>
    readStorage(REVIEWS_KEY)
  );

  const [filter, setFilter] = useState("all");
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [message, setMessage] = useState("");

  const today = getToday();

  // Show bookings belonging to the logged-in customer
  const myBookings = bookings
    .filter((booking) => booking.userId === user.id)
    .sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );

  // Filter bookings by status and dates
  const visibleBookings = myBookings.filter((booking) => {
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

  // Cancel an eligible reservation
  function cancelBooking(bookingId) {
    const booking = bookings.find(
      (item) =>
        item.id === bookingId &&
        item.userId === user.id
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

    const updatedBookings = bookings.map((item) =>
      item.id === bookingId
        ? { ...item, status: "cancelled" }
        : item
    );

    localStorage.setItem(
      BOOKINGS_KEY,
      JSON.stringify(updatedBookings)
    );

    setBookings(updatedBookings);
    setMessage("Your reservation has been cancelled.");
  }

  // Submit a review for a completed stay
  function submitReview(data) {
    const booking = bookings.find(
      (item) =>
        item.id === data.bookingId &&
        item.userId === user.id &&
        item.propertyId === data.propertyId
    );

    // Reviews are only allowed after checkout
    if (
      !booking ||
      booking.status !== "confirmed" ||
      booking.checkOut > getToday()
    ) {
      setMessage("Only completed stays can be reviewed.");
      return;
    }

    // Prevent duplicate reviews
    const alreadyReviewed = reviews.some(
      (review) => review.bookingId === booking.id
    );

    if (alreadyReviewed) {
      setMessage("You have already reviewed this booking.");
      return;
    }

    // Validate rating and comment
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
      userId: user.id,
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
    setMessage("Thank you! Your review has been submitted.");
  }

  return (
    <main className="bookings-page">
      {/* Page Header */}
      <div className="bookings-header">
        <h1>My Bookings</h1>
        <p>
          View and manage your vacation rental reservations.
        </p>
      </div>

      {/* Success and Error Messages */}
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

      {/* Booking Filters */}
      <div className="booking-filters">
        {["all", "upcoming", "past", "cancelled"].map((option) => (
          <button
            type="button"
            key={option}
            className={filter === option ? "active" : ""}
            onClick={() => setFilter(option)}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {/* Empty Booking State */}
      {visibleBookings.length === 0 ? (
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
        <div className="booking-list">
          {visibleBookings.map((booking) => {
            const property = properties.find(
              (item) => item.id === booking.propertyId
            );

            // Allow cancellation through check-in day
            const canCancel =
              booking.status === "confirmed" &&
              booking.checkIn >= today;

            // Reviews are available after checkout
            const canReview =
              booking.status === "confirmed" &&
              booking.checkOut <= today;

            const existingReview = reviews.find(
              (review) => review.bookingId === booking.id
            );

            return (
              <article
                className="booking-card"
                key={booking.id}
              >
                {/* Property Image */}
                {property && (
                  <img
                    src={property.image}
                    alt={property.title}
                    className="booking-card-image"
                  />
                )}

                <div className="booking-card-content">
                  {/* Property Name and Status */}
                  <div className="booking-card-top">
                    <h2>{booking.propertyTitle}</h2>

                    <span
                      className={`booking-status ${booking.status}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {/* Booking Information */}
                  <p>
                    {formatDate(booking.checkIn)} –{" "}
                    {formatDate(booking.checkOut)}
                  </p>

                  <p>
                    {booking.guests}{" "}
                    {booking.guests === 1 ? "guest" : "guests"}
                    {" · "}
                    {booking.nights}{" "}
                    {booking.nights === 1 ? "night" : "nights"}
                  </p>

                  <p className="booking-total">
                    Total: ${booking.total.toLocaleString()}
                  </p>

                  {/* Booking Actions */}
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
                        onClick={() =>
                          cancelBooking(booking.id)
                        }
                      >
                        Cancel booking
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

                  {/* Display Submitted Review */}
                  {existingReview && (
                    <div className="submitted-review">
                      <strong>Your review</strong>

                      <p className="submitted-stars">
                        {"★".repeat(existingReview.rating)}
                        {"☆".repeat(5 - existingReview.rating)}
                      </p>

                      <p>{existingReview.comment}</p>
                    </div>
                  )}

                  {/* Review Submission Form */}
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
