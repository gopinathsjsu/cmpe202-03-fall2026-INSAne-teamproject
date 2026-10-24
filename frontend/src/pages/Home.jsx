import { useState } from "react";
import PropertyCard from "../components/PropertyCard";
import { getAvailableProperties } from "../services/properties";

export default function Home() {
  // ==========================================
  // SEARCH STATES
  // ==========================================
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const [appliedFilters, setAppliedFilters] = useState(null);
  const [error, setError] = useState("");

  // ==========================================
  // GET AVAILABLE PROPERTIES
  // ==========================================
  const properties = getAvailableProperties();

  // ==========================================
  // HELPER: LOCAL TODAY DATE
  // ==========================================
  const getToday = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ==========================================
  // HELPER: CALCULATE NIGHTS
  // ==========================================
  const calculateNights = (start, end) => {
    if (!start || !end) return 0;

    const startDate = Date.parse(
      `${start}T00:00:00Z`
    );

    const endDate = Date.parse(
      `${end}T00:00:00Z`
    );

    return (endDate - startDate) / 86400000;
  };

  // ==========================================
  // HANDLE SEARCH
  // ==========================================
  const handleSearch = (event) => {
    event.preventDefault();
    setError("");

    // Validate dates
    if (checkIn || checkOut) {
      if (!checkIn || !checkOut) {
        setError(
          "Please select both check-in and check-out dates."
        );
        return;
      }

      const nights = calculateNights(
        checkIn,
        checkOut
      );

      if (checkIn < getToday()) {
        setError(
          "Check-in date cannot be in the past."
        );
        return;
      }

      if (
        !Number.isFinite(nights) ||
        nights < 1 ||
        nights > 14
      ) {
        setError(
          "Bookings must be between 1 and 14 nights."
        );
        return;
      }
    }

    // Validate guest count
    const guestCount = Number(guests);

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > 20
    ) {
      setError(
        "Please enter between 1 and 20 guests."
      );
      return;
    }

    // Apply filters
    setAppliedFilters({
      location: location.trim().toLowerCase(),
      checkIn,
      checkOut,
      guests: guestCount,
    });
  };

  // ==========================================
  // RESET SEARCH
  // ==========================================
  const resetSearch = () => {
    setLocation("");
    setCheckIn("");
    setCheckOut("");
    setGuests(1);
    setAppliedFilters(null);
    setError("");
  };

  // ==========================================
  // FILTER PROPERTIES
  // ==========================================
  const filteredProperties = properties.filter(
    (property) => {
      if (!appliedFilters) {
        return true;
      }

      const locationText = [
        property.title,
        property.city,
        property.state,
        property.zipCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesLocation =
        !appliedFilters.location ||
        locationText.includes(
          appliedFilters.location
        );

      const matchesGuests =
        Number(property.guests) >=
        appliedFilters.guests;

      // Date overlap checks will be handled
      // by the backend booking API.
      return matchesLocation && matchesGuests;
    }
  );

  // ==========================================
  // RENDER HOMEPAGE
  // ==========================================
  return (
    <main className="rental-home">

      {/* =====================================
          HERO SECTION
      ===================================== */}
      <section className="hero-section">

        <div className="hero-content">
          <h1>
            Find your next unforgettable stay
          </h1>

          <p>
            Discover beautiful homes, unique
            getaways, and places you'll love
            with Insane Stays.
          </p>
        </div>

        {/* =================================
            SEARCH BAR
        ================================= */}
        <form
          className="search-bar"
          onSubmit={handleSearch}
        >
          <div className="search-fields">

            {/* LOCATION */}
            <div className="search-field location-field">
              <label htmlFor="location">
                Where
              </label>

              <input
                id="location"
                type="text"
                placeholder="City, state, or ZIP code"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
              />
            </div>

            {/* CHECK-IN */}
            <div className="search-field">
              <label htmlFor="checkIn">
                Check-in
              </label>

              <input
                id="checkIn"
                type="date"
                min={getToday()}
                value={checkIn}
                onChange={(event) =>
                  setCheckIn(event.target.value)
                }
              />
            </div>

            {/* CHECK-OUT */}
            <div className="search-field">
              <label htmlFor="checkOut">
                Check-out
              </label>

              <input
                id="checkOut"
                type="date"
                min={checkIn || getToday()}
                value={checkOut}
                onChange={(event) =>
                  setCheckOut(event.target.value)
                }
              />
            </div>

            {/* GUESTS */}
            <div className="search-field guests-field">
              <label htmlFor="guests">
                Guests
              </label>

              <input
                id="guests"
                type="number"
                min="1"
                max="20"
                value={guests}
                onChange={(event) =>
                  setGuests(event.target.value)
                }
              />
            </div>

            {/* SEARCH BUTTON */}
            <button
              type="submit"
              className="search-button"
            >
              Search
            </button>

          </div>

          {error && (
            <p
              className="search-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {appliedFilters && (
            <button
              type="button"
              onClick={resetSearch}
              className="reset-button"
            >
              Clear Search
            </button>
          )}

        </form>
      </section>

      {/* =====================================
          PROPERTY LISTINGS
      ===================================== */}
      <section className="listings-section">

        <div className="listings-heading">
          <div>
            <h2>
              {appliedFilters
                ? "Search Results"
                : "Explore Amazing Stays"}
            </h2>

            <p>
              {filteredProperties.length}{" "}
              {filteredProperties.length === 1
                ? "property"
                : "properties"}{" "}
              available to explore
            </p>
          </div>
        </div>

        {/* =================================
            NO RESULTS
        ================================= */}
        {filteredProperties.length === 0 ? (
          <div className="empty-results">
            <h3>No properties found</h3>

            <p>
              Try another location or adjust
              your guest count.
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={resetSearch}
            >
              Clear Search
            </button>
          </div>
        ) : (

          /* ===============================
              PROPERTY GRID
          =============================== */
          <div className="property-grid">
            {filteredProperties.map(
              (property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                />
              )
            )}
          </div>
        )}

      </section>
    </main>
  );
}
