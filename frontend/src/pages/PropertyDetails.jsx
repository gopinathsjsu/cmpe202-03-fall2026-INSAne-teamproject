
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { properties } from "../data/properties";

export default function PropertyDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const property = properties.find(
    (item) => item.id === Number(id)
  );

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!property) {
    return (
      <main className="details-page">
        <h2>Property not found</h2>
        <Link to="/">Return to homepage</Link>
      </main>
    );
  }

  const today = new Date().toLocaleDateString("en-CA");

  const nights =
    checkIn && checkOut
      ? (Date.parse(checkOut + "T00:00:00Z") -
          Date.parse(checkIn + "T00:00:00Z")) /
        86400000
      : 0;

  const validNights = nights >= 1 && nights <= 14;
  const total = validNights ? nights * property.price : 0;

  function handleBooking(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "customer") {
      setError("Only customers can book vacation rentals.");
      return;
    }

    if (!checkIn || !checkOut || !validNights) {
      setError("Please select a stay between 1 and 14 nights.");
      return;
    }

    if (checkIn < today) {
      setError("Check-in cannot be in the past.");
      return;
    }

    if (guests < 1 || guests > property.guests) {
      setError(`This property allows up to ${property.guests} guests.`);
      return;
    }

    const booking = {
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

    const bookings = JSON.parse(
      localStorage.getItem("staynest_bookings") || "[]"
    );

    // This is a frontend-only mock booking.
    // Availability must be checked by the backend later.
    bookings.push(booking);

    localStorage.setItem(
      "staynest_bookings",
      JSON.stringify(bookings)
    );

    setSuccess("Your mock booking has been confirmed!");
  }

  return (
    <main className="details-page">
      <Link to="/" className="back-link">
        ← Back to all stays
      </Link>

      <div className="details-heading">
        <h1>{property.title}</h1>
        <p>
          ★ {property.rating} · {property.reviews} reviews ·{" "}
          {property.city}, {property.state}
        </p>
      </div>

      <img
        src={property.image}
        alt={property.title}
        className="details-hero-image"
      />

      <div className="details-layout">
        <section className="details-info">
          <h2>About this property</h2>

          <p>
            Enjoy your stay at {property.title}, located in
            {` ${property.city}, ${property.state}`}.
            This vacation rental accommodates up to
            {` ${property.guests}`} guests and includes
            {` ${property.bedrooms}`} bedrooms.
          </p>

          <hr />

          <h2>What this place offers</h2>

          <div className="amenities-list">
            {property.amenities.map((amenity) => (
              <div className="amenity-item" key={amenity}>
                ✓ {amenity}
              </div>
            ))}
          </div>

          <hr />

          <h2>Guest reviews</h2>
          <p>
            ★ {property.rating} out of 5 ·{" "}
            {property.reviews} reviews
          </p>
          <p className="muted-text">
            Individual guest reviews will appear here
            when the reviews API is connected.
          </p>
        </section>

        <aside className="reservation-card">
          <h2>
            ${property.price}
            <span> / night</span>
          </h2>

          <form onSubmit={handleBooking}>
            <div className="reservation-dates">
              <div>
                <label htmlFor="booking-checkin">
                  Check-in
                </label>
                <input
                  id="booking-checkin"
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="booking-checkout">
                  Check-out
                </label>
                <input
                  id="booking-checkout"
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                />
              </div>
            </div>

            <label htmlFor="booking-guests">Guests</label>
            <select
              id="booking-guests"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            >
              {Array.from(
                { length: property.guests },
                (_, index) => index + 1
              ).map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "guest" : "guests"}
                </option>
              ))}
            </select>

            {validNights && (
              <div className="price-breakdown">
                <div>
                  <span>
                    ${property.price} × {nights} nights
                  </span>
                  <span>${total}</span>
                </div>
                <hr />
                <div className="price-total">
                  <strong>Total</strong>
                  <strong>${total}</strong>
                </div>
              </div>
            )}

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="booking-success" role="status">
                {success}
              </p>
            )}

            <button type="submit" className="primary-btn">
              Reserve
            </button>
          </form>

          <p className="reservation-note">
            Demo reservation only. No payment will be charged.
          </p>
        </aside>
      </div>
    </main>
  );
}
