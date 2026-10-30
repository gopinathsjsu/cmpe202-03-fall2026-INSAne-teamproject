import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCurrentUser } from "../services/auth";
import { getBackendPropertyById } from "../services/backendProperties";
import { createBooking } from "../services/bookings";
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
// PROPERTY DETAILS PAGE
// ==========================================
export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const user = getCurrentUser();

  const [property, setProperty] = useState(null);

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState("");
  const [propertyError, setPropertyError] = useState("");

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
  // CHECK INPUTS
  // Actual availability is enforced by
  // PostgreSQL when the booking is created.
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
        "Your dates and guest count are valid. Actual availability will be confirmed when you reserve.",
    });
  }

  // ==========================================
  // CREATE BOOKING IN POSTGRESQL
  // ==========================================
  async function handleBooking(event) {
    event.preventDefault();
    setError("");
    setAvailability(null);

    if (bookingLoading) return;

    // Require customer authentication
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "customer") {
      setError("Only customers can make reservations.");
      return;
    }

    // Validate reservation details
    const validationError = validateBooking();

    if (validationError) {
      setError(validationError);
      return;
    }

    setBookingLoading(true);

    try {
      // Create booking through Express API
      // PostgreSQL prevents overlapping stays.
      await createBooking({
        propertyId: property.id,
        checkIn,
        checkOut,
        guests: Number(guests),
      });

      // Booking was saved successfully
      navigate("/my-bookings");

    } catch (err) {
      // Includes 409 Conflict for booked dates
      setError(
        err.message || "Failed to create reservation."
      );
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <main className="property-details-page">

      {/* BACK BUTTON */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="back-button"
      >
        ← Back to Properties
      </button>

      {/* PROPERTY TITLE */}
      <h1>{property.title}</h1>

      {/* PROPERTY LOCATION */}
      <p className="property-location">
        {property.city}, {property.state}
        {property.zip_code
          ? ` ${property.zip_code}`
          : ""}
      </p>

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

          {/* DESCRIPTION */}
          <h2>About This Property</h2>

          <p>
            {property.description ||
              `Enjoy your stay at ${property.title}, located in ${property.city}, ${property.state}.`}
          </p>

          {/* PROPERTY DETAILS */}
          <div className="property-details-info">

            <p>
              <strong>Guests:</strong> Up to {maxGuests}
            </p>

            <p>
              <strong>Bedrooms:</strong>{" "}
              {property.bedrooms || 1}
            </p>

          </div>

          {/* AMENITIES */}
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

          {/* APPROXIMATE LOCATION MAP */}
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

              {/* DATES */}
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

              {/* GUEST SELECTION */}
              <div className="booking-guests-field">

                <label htmlFor="guests">
                  Guests
                </label>

                <select
                  id="guests"
                  value={guests}
                  onChange={(event) => {
                    setGuests(Number(event.target.value));
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

              {/* DATE VALIDATION */}
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

              {/* API ERROR MESSAGE */}
              {error && (
                <p
                  className="availability-error"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {/* PRICE BREAKDOWN */}
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

              {/* RESERVE BUTTON */}
              <button
                type="submit"
                className="book-now-btn"
                disabled={bookingLoading}
              >
                {bookingLoading
                  ? "Processing reservation..."
                  : "Reserve Now"}
              </button>

              {/* BOOKING NOTES */}
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
