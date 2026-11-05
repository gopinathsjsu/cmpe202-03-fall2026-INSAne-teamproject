import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCurrentUser } from "../services/auth";
import { getBackendPropertyById } from "../services/backendProperties";
import { createBooking } from "../services/bookings";
import { getPropertyReviews } from "../services/reviews";

// Google Maps integration - teammate's feature
import {
  getPropertyPosition,
  isGoogleMapsEnabled,
} from "../services/googleMaps";
import PropertyMap from "../components/PropertyMap";

// ==========================================
// HELPER: GET TODAY'S DATE
// ==========================================
function getToday() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

// ==========================================
// HELPER: CALCULATE NUMBER OF NIGHTS
// ==========================================
function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;

  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }

  return (end - start) / 86400000;
}

// ==========================================
// HELPER: FORMAT PRICE
// ==========================================
function formatPrice(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

// ==========================================
// HELPER: FORMAT REVIEW DATE
// ==========================================
function formatReviewDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ==========================================
// HELPER: NORMALIZE AMENITIES
// ==========================================
function getAmenities(amenities) {
  if (Array.isArray(amenities)) {
    return amenities;
  }

  if (typeof amenities === "string") {
    return amenities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (amenities && typeof amenities === "object") {
    return Object.entries(amenities)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([name]) => name);
  }

  return [];
}

// ==========================================
// COMPONENT: RATING STARS
// ==========================================
function RatingStars({ rating, size = "20px" }) {
  const numericRating = Math.max(
    0,
    Math.min(5, Number(rating) || 0)
  );

  const filledStars = Math.round(numericRating);

  return (
    <span
      aria-label={`${numericRating} out of 5 stars`}
      title={`${numericRating} out of 5 stars`}
      style={{
        color: "#e3a128",
        fontSize: size,
        letterSpacing: "2px",
      }}
    >
      {"★".repeat(filledStars)}
      {"☆".repeat(5 - filledStars)}
    </span>
  );
}

// ==========================================
// PROPERTY DETAILS PAGE
// ==========================================
export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = getCurrentUser();

  // ==========================================
  // PROPERTY STATE
  // ==========================================
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [propertyError, setPropertyError] = useState("");

  // ==========================================
  // BOOKING STATE
  // ==========================================
  const [bookingLoading, setBookingLoading] = useState(false);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState("");

  // ==========================================
  // REVIEW STATE
  // ==========================================
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");

  // ==========================================
  // LOAD PROPERTY FROM POSTGRESQL
  // ==========================================
  useEffect(() => {
    let active = true;

    async function loadProperty() {
      setLoading(true);
      setPropertyError("");
      setProperty(null);

      setCheckIn("");
      setCheckOut("");
      setGuests(1);

      setAvailability(null);
      setError("");

      try {
        const data = await getBackendPropertyById(id);

        if (active) {
          setProperty(data);
        }
      } catch (err) {
        if (active) {
          setPropertyError(
            err.message || "Failed to load property."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProperty();

    return () => {
      active = false;
    };
  }, [id]);

  // ==========================================
  // LOAD PROPERTY REVIEWS FROM POSTGRESQL
  // ==========================================
  useEffect(() => {
    let active = true;

    async function loadReviews() {
      setReviewsLoading(true);
      setReviewsError("");

      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);

      try {
        const data = await getPropertyReviews(id);

        if (!active) return;

        setReviews(
          Array.isArray(data.reviews) ? data.reviews : []
        );

        setAverageRating(
          Number(data.averageRating) || 0
        );

        setTotalReviews(
          Number(data.totalReviews) || 0
        );
      } catch (err) {
        if (active) {
          setReviewsError(
            err.message || "Unable to load guest reviews."
          );
        }
      } finally {
        if (active) {
          setReviewsLoading(false);
        }
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, [id]);

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (loading) {
    return (
      <main className="details-page">
        <h2>Loading property...</h2>
        <p>Retrieving property information.</p>
      </main>
    );
  }

  // ==========================================
  // PROPERTY NOT FOUND
  // ==========================================
  if (!property) {
    return (
      <main className="details-page">
        <h2>Property Not Available</h2>

        <p>
          {propertyError ||
            "This property does not exist or is not approved."}
        </p>

        <button
          type="button"
          className="primary-btn"
          onClick={() => navigate("/")}
        >
          Back to Home
        </button>
      </main>
    );
  }

  // ==========================================
  // PROPERTY INFORMATION
  // ==========================================
  const today = getToday();

  const maxGuests = Number(property.max_guests) || 1;
  const price = Number(property.price_per_night) || 0;

  const nights = calculateNights(checkIn, checkOut);

  const validNights =
    Number.isFinite(nights) &&
    nights >= 1 &&
    nights <= 14;

  const total = validNights ? nights * price : 0;

  const amenities = getAmenities(property.amenities);
  const image = property.image_url;

  // ==========================================
  // VALIDATE RESERVATION INPUT
  // ==========================================
  function validateBooking() {
    if (!checkIn || !checkOut) {
      return "Please select both check-in and check-out dates.";
    }

    if (checkIn < today) {
      return "Check-in cannot be in the past.";
    }

    if (!validNights) {
      return "Bookings must be between 1 and 14 nights.";
    }

    const guestCount = Number(guests);

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > maxGuests
    ) {
      return `Please select between 1 and ${maxGuests} guests.`;
    }

    return null;
  }

  // ==========================================
  // VALIDATE BOOKING INPUTS
  // ==========================================
  // PostgreSQL validates actual booking availability
  // when the reservation is submitted.
  // ==========================================
  function handleCheckAvailability() {
    setError("");

    const validationError = validateBooking();

    if (validationError) {
      setAvailability({
        available: false,
        message: validationError,
      });
      return;
    }

    setAvailability({
      available: null,
      message:
        "Your dates and guest count are valid. " +
        "Actual availability will be confirmed when you reserve.",
    });
  }

  // ==========================================
  // CREATE BOOKING THROUGH EXPRESS API
  // ==========================================
  async function handleBooking(event) {
    event.preventDefault();

    setError("");
    setAvailability(null);

    if (bookingLoading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "customer") {
      setError("Only customers can make reservations.");
      return;
    }

    const validationError = validateBooking();

    if (validationError) {
      setError(validationError);
      return;
    }

    setBookingLoading(true);

    try {
      await createBooking({
        propertyId: property.id,
        checkIn,
        checkOut,
        guests: Number(guests),
      });

      navigate("/my-bookings");
    } catch (err) {
      setError(
        err.message || "Failed to create reservation."
      );
    } finally {
      setBookingLoading(false);
    }
  }

  // ==========================================
  // RENDER PAGE
  // ==========================================
  return (
    <main className="property-details-page">

      {/* ======================================
          BACK BUTTON
      ====================================== */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="back-button"
      >
        ← Back to Properties
      </button>

      {/* ======================================
          PROPERTY TITLE
      ====================================== */}
      <h1>{property.title}</h1>

      {/* PROPERTY LOCATION */}
      <p className="property-location">
        {property.city}, {property.state}
        {property.zip_code
          ? ` ${property.zip_code}`
          : ""}
      </p>

      {/* ======================================
          PROPERTY RATING SUMMARY
      ====================================== */}
      {!reviewsLoading &&
        !reviewsError &&
        totalReviews > 0 && (
          <div
            className="property-rating-summary"
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <RatingStars rating={averageRating} />

            <strong>
              {averageRating.toFixed(1)}
            </strong>

            <span>
              ({totalReviews}{" "}
              {totalReviews === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}

      <div className="property-details-layout">

        {/* ==================================
            PROPERTY INFORMATION
        ================================== */}
        <div className="property-details-content">

          {/* PROPERTY IMAGE */}
          {image ? (
            <img
              src={image}
              alt={property.title}
              className="property-details-image"
            />
          ) : (
            <div
              className="property-details-image"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "240px",
                background: "#f5f5f5",
                borderRadius: "12px",
                color: "#777",
              }}
            >
              Property image coming soon
            </div>
          )}

          {/* ==================================
              PROPERTY DESCRIPTION
          ================================== */}
          <h2>About This Property</h2>

          <p>
            {property.description ||
              `Enjoy your stay at ${property.title}, located in ${property.city}, ${property.state}.`}
          </p>

          {/* PROPERTY CAPACITY */}
          <div className="property-details-info">
            <p>
              <strong>Guests:</strong> Up to {maxGuests}
            </p>

            <p>
              <strong>Bedrooms:</strong>{" "}
              {property.bedrooms ?? 1}
            </p>
          </div>

          {/* ==================================
              AMENITIES
          ================================== */}
          <h2>Amenities</h2>

          {amenities.length > 0 ? (
            <div className="property-amenities">
              {amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="amenity-tag"
                >
                  {String(amenity)}
                </span>
              ))}
            </div>
          ) : (
            <p>No amenities listed.</p>
          )}

          {/* ==================================
              GOOGLE MAPS INTEGRATION
              TEAMMATE'S EXISTING FEATURE
          ================================== */}
          {isGoogleMapsEnabled() &&
            getPropertyPosition(property) && (
              <>
                <h2>Where You'll Be</h2>

                <PropertyMap
                  properties={[property]}
                  approximate
                  className="property-map property-map-small"
                />

                <p className="map-note">
                  The map shows the approximate area.
                </p>
              </>
            )}

          {/* ==================================
              GUEST REVIEWS AND RATINGS
              POSTGRESQL INTEGRATION
          ================================== */}
          <section
            className="property-reviews-section"
            aria-labelledby="guest-reviews-title"
            style={{ marginTop: "32px" }}
          >
            <h2 id="guest-reviews-title">
              Guest Reviews
            </h2>

            {reviewsLoading ? (
              <p role="status">
                Loading reviews...
              </p>
            ) : reviewsError ? (
              <p
                role="alert"
                className="error-message"
              >
                {reviewsError}
              </p>
            ) : totalReviews === 0 ? (
              <div
                className="empty-reviews"
                style={{
                  padding: "18px",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                }}
              >
                <p>No reviews yet.</p>

                <p>
                  Be the first guest to review this
                  property after completing a stay.
                </p>
              </div>
            ) : (
              <>
                {/* AVERAGE RATING */}
                <div
                  className="reviews-overview"
                  style={{
                    padding: "16px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <RatingStars
                      rating={averageRating}
                      size="26px"
                    />

                    <strong
                      style={{ fontSize: "24px" }}
                    >
                      {averageRating.toFixed(1)} / 5
                    </strong>
                  </div>

                  <p>
                    Based on {totalReviews}{" "}
                    {totalReviews === 1
                      ? "guest review"
                      : "guest reviews"}
                  </p>
                </div>

                {/* INDIVIDUAL REVIEWS */}
                <div
                  className="reviews-list"
                  style={{
                    display: "grid",
                    gap: "16px",
                  }}
                >
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="guest-review-card"
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "12px",
                        padding: "18px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "flex-start",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <strong>
                            {review.customer_name ||
                              "Guest"}
                          </strong>

                          <p
                            style={{
                              margin: "6px 0",
                            }}
                          >
                            <RatingStars
                              rating={review.rating}
                            />
                          </p>
                        </div>

                        <small>
                          {formatReviewDate(
                            review.created_at
                          )}
                        </small>
                      </div>

                      <p
                        style={{
                          marginTop: "12px",
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {review.comment}
                      </p>

                      <small
                        style={{ color: "#666" }}
                      >
                        Review from a completed booking
                      </small>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        {/* ==================================
            BOOKING SECTION
        ================================== */}
        <div className="property-booking-section">
          <div className="property-booking-card">

            {/* PRICE PER NIGHT */}
            <h2>
              {formatPrice(price)}{" "}
              <span>/ night</span>
            </h2>

            <form onSubmit={handleBooking}>

              {/* ==================================
                  CHECK-IN / CHECK-OUT
              ================================== */}
              <div className="booking-date-fields">
                <div>
                  <label htmlFor="checkIn">
                    Check-in
                  </label>

                  <input
                    id="checkIn"
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(event) => {
                      setCheckIn(event.target.value);
                      setAvailability(null);
                      setError("");
                    }}
                    disabled={bookingLoading}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="checkOut">
                    Check-out
                  </label>

                  <input
                    id="checkOut"
                    type="date"
                    min={checkIn || today}
                    value={checkOut}
                    onChange={(event) => {
                      setCheckOut(event.target.value);
                      setAvailability(null);
                      setError("");
                    }}
                    disabled={bookingLoading}
                    required
                  />
                </div>
              </div>

              {/* ==================================
                  NUMBER OF GUESTS
              ================================== */}
              <div className="booking-guests-field">
                <label htmlFor="guests">
                  Guests
                </label>

                <select
                  id="guests"
                  value={guests}
                  onChange={(event) => {
                    setGuests(
                      Number(event.target.value)
                    );
                    setAvailability(null);
                    setError("");
                  }}
                  disabled={bookingLoading}
                >
                  {Array.from(
                    { length: maxGuests },
                    (_, index) => index + 1
                  ).map((number) => (
                    <option
                      key={number}
                      value={number}
                    >
                      {number}{" "}
                      {number === 1
                        ? "guest"
                        : "guests"}
                    </option>
                  ))}
                </select>
              </div>

              {/* ==================================
                  VALIDATE DATES
              ================================== */}
              <button
                type="button"
                onClick={handleCheckAvailability}
                className="check-availability-btn"
                disabled={bookingLoading}
              >
                Validate Dates
              </button>

              {/* VALIDATION MESSAGE */}
              {availability && (
                <p
                  className={
                    availability.available === false
                      ? "availability-error"
                      : "availability-success"
                  }
                  role="status"
                >
                  {availability.message}
                </p>
              )}

              {/* BOOKING API ERROR */}
              {error && (
                <p
                  className="availability-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {/* ==================================
                  PRICE BREAKDOWN
              ================================== */}
              {validNights && (
                <div className="booking-price-summary">
                  <p>
                    {formatPrice(price)} × {nights}{" "}
                    {nights === 1
                      ? "night"
                      : "nights"}
                  </p>

                  <h3>
                    Total: {formatPrice(total)}
                  </h3>
                </div>
              )}

              {/* ==================================
                  RESERVE BUTTON
              ================================== */}
              <button
                type="submit"
                className="book-now-btn"
                disabled={bookingLoading}
              >
                {bookingLoading
                  ? "Processing reservation..."
                  : "Reserve Now"}
              </button>

              {/* BOOKING INFORMATION */}
              <p className="booking-note">
                Maximum stay: 14 nights.
              </p>

              <p className="booking-note">
                Availability and final price are
                confirmed by the backend.
              </p>
            </form>

          </div>
        </div>

      </div>
    </main>
  );
}
