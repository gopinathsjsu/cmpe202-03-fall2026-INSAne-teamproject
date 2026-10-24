
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser } from "../services/auth";
import { getPropertyById } from "../services/properties";
import {
  checkAvailability,
  calculateNights,
  getBookings,
} from "../services/bookingavailability";

function getToday() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const property = getPropertyById(id);
  const user = getCurrentUser();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState("");

  if (!property) {
    return (
      <div className="property-details-page">
        <h2>Property Not Found</h2>
        <p>This property does not exist or is no longer available.</p>
        <button onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  const today = getToday();
  const maxGuests = Number(property.guests) || 1;
  const price = Number(property.price) || 0;

  const nights = calculateNights(checkIn, checkOut);
  const validNights =
    Number.isFinite(nights) && nights >= 1 && nights <= 14;

  const total = validNights ? nights * price : 0;

  const handleCheckAvailability = () => {
    setError("");

    const result = checkAvailability(
      property.id,
      checkIn,
      checkOut
    );

    setAvailability(result);
  };

  const handleBooking = (e) => {
    e.preventDefault();
    setError("");

    // Customers must be logged in before booking.
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "customer") {
      setError("Only customers can make reservations.");
      return;
    }

    // Validate the number of guests.
    if (
      !Number.isInteger(Number(guests)) ||
      Number(guests) < 1 ||
      Number(guests) > maxGuests
    ) {
      setError(
        `Please select between 1 and ${maxGuests} guests.`
      );
      return;
    }

    // Recheck availability immediately before saving.
    const result = checkAvailability(
      property.id,
      checkIn,
      checkOut
    );

    setAvailability(result);

    if (!result.available) {
      return;
    }

    // Create the booking using the existing data format.
    const newBooking = {
      id: crypto.randomUUID(),
      userId: user.id,
      propertyId: property.id,
      propertyTitle: property.title,
      checkIn,
      checkOut,
      guests: Number(guests),
      nights,
      total,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };

    const existingBookings = getBookings();

    localStorage.setItem(
      "staynest_bookings",
      JSON.stringify([...existingBookings, newBooking])
    );

    navigate("/my-bookings");
  };

  return (
    <div className="property-details-page">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="back-button"
      >
        ← Back to Properties
      </button>

      <h1>{property.title}</h1>

      <p className="property-location">
        {property.city}, {property.state}
        {property.zipCode ? ` ${property.zipCode}` : ""}
      </p>

      <div className="property-details-layout">
        {/* Property information */}
        <div className="property-details-content">
          <img
            src={property.image}
            alt={property.title}
            className="property-details-image"
          />

          <h2>About This Property</h2>

          <p>
            {property.description ||
              `Enjoy your stay at ${property.title}, located in ${property.city}, ${property.state}.`}
          </p>

          <div className="property-details-info">
            <p>
              <strong>Guests:</strong> Up to {maxGuests}
            </p>

            <p>
              <strong>Bedrooms:</strong>{" "}
              {property.bedrooms || 1}
            </p>

            {Number(property.reviews) > 0 && (
              <p>
                <strong>Rating:</strong> ⭐ {property.rating} (
                {property.reviews} reviews)
              </p>
            )}
          </div>

          <h2>Amenities</h2>

          {property.amenities &&
          property.amenities.length > 0 ? (
            <div className="property-amenities">
              {(Array.isArray(property.amenities)
                ? property.amenities
                : String(property.amenities).split(",")
              ).map((amenity, index) => (
                <span key={index} className="amenity-tag">
                  {String(amenity).trim()}
                </span>
              ))}
            </div>
          ) : (
            <p>No amenities listed.</p>
          )}
        </div>

        {/* Booking section */}
        <div className="property-booking-section">
          <div className="property-booking-card">
            <h2>
              ${price.toLocaleString()}{" "}
              <span>/ night</span>
            </h2>

            <form onSubmit={handleBooking}>
              <div className="booking-date-fields">
                <div>
                  <label htmlFor="checkIn">Check-in</label>

                  <input
                    id="checkIn"
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      setAvailability(null);
                      setError("");
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="checkOut">Check-out</label>

                  <input
                    id="checkOut"
                    type="date"
                    min={checkIn || today}
                    value={checkOut}
                    onChange={(e) => {
                      setCheckOut(e.target.value);
                      setAvailability(null);
                      setError("");
                    }}
                    required
                  />
                </div>
              </div>

              <div className="booking-guests-field">
                <label htmlFor="guests">Guests</label>

                <select
                  id="guests"
                  value={guests}
                  onChange={(e) => {
                    setGuests(Number(e.target.value));
                    setError("");
                  }}
                >
                  {Array.from(
                    { length: maxGuests },
                    (_, index) => index + 1
                  ).map((number) => (
                    <option key={number} value={number}>
                      {number}{" "}
                      {number === 1 ? "guest" : "guests"}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleCheckAvailability}
                className="check-availability-btn"
              >
                Check Availability
              </button>

              {availability && (
                <p
                  className={
                    availability.available
                      ? "availability-success"
                      : "availability-error"
                  }
                >
                  {availability.message}
                </p>
              )}

              {error && (
                <p className="availability-error">
                  {error}
                </p>
              )}

              {validNights && (
                <div className="booking-price-summary">
                  <p>
                    ${price.toLocaleString()} × {nights}{" "}
                    {nights === 1 ? "night" : "nights"}
                  </p>

                  <h3>
                    Total: ${total.toLocaleString()}
                  </h3>
                </div>
              )}

              <button
                type="submit"
                className="book-now-btn"
              >
                Reserve Now
              </button>

              <p className="booking-note">
                Maximum stay: 14 nights.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
