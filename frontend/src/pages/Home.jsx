import { useEffect, useState } from "react";

import PropertyCard from "../components/PropertyCard";
import { getBackendProperties } from "../services/backendProperties";

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
// HELPER: CALCULATE NIGHTS
// ==========================================
function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;

  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);

  return (end - start) / 86400000;
}

// ==========================================
// HOMEPAGE
// ==========================================
export default function Home() {
  // ==========================================
  // PROPERTY STATES
  // ==========================================
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

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
  // LOAD APPROVED PROPERTIES FROM POSTGRESQL
  // ==========================================
  useEffect(() => {
    let active = true;

    async function loadProperties() {
      setLoading(true);
      setLoadError("");

      try {
        const data = await getBackendProperties();

        if (active) {
          setProperties(data);
        }
      } catch (err) {
        if (active) {
          setLoadError(
            err.message || "Failed to load properties."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProperties();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================
  // HANDLE SEARCH
  // ==========================================
  function handleSearch(event) {
    event.preventDefault();
    setError("");

    if (checkIn || checkOut) {
      if (!checkIn || !checkOut) {
        setError(
          "Please select both check-in and check-out dates."
        );
        return;
      }

      const nights = calculateNights(checkIn, checkOut);

      if (checkIn < getToday()) {
        setError("Check-in cannot be in the past.");
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

    const guestCount = Number(guests);

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > 20
    ) {
      setError("Please enter between 1 and 20 guests.");
      return;
    }

    setAppliedFilters({
      location: location.trim().toLowerCase(),
      checkIn,
      checkOut,
      guests: guestCount,
    });
  }

  // ==========================================
  // RESET SEARCH
  // ==========================================
  function resetSearch() {
    setLocation("");
    setCheckIn("");
    setCheckOut("");
    setGuests(1);
    setAppliedFilters(null);
    setError("");
  }

  // ==========================================
  // FILTER PROPERTIES
  // ==========================================
  const filteredProperties = properties.filter((property) => {
    if (!appliedFilters) {
      return true;
    }

    const locationText = [
      property.title,
      property.city,
      property.state,
      property.zip_code,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesLocation =
      !appliedFilters.location ||
      locationText.includes(appliedFilters.location);

    const matchesGuests =
      Number(property.max_guests) >= appliedFilters.guests;

    // Dates are validated here.
    // Overlapping reservations are prevented
    // by PostgreSQL when a customer books.
    return matchesLocation && matchesGuests;
  });

  return (
    <main className="rental-home">

      {/* ======================================
          HERO SECTION
      ====================================== */}
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

        {/* SEARCH BAR */}
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

            {/* GUEST COUNT */}
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
                required
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

          {/* SEARCH ERROR */}
          {error && (
            <p
              className="search-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* CLEAR SEARCH */}
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

      {/* ======================================
          PROPERTY LISTINGS
      ====================================== */}
      <section className="listings-section">

        <div className="listings-heading">
          <div>
            <h2>
              {appliedFilters
                ? "Search Results"
                : "Explore Amazing Stays"}
            </h2>

            <p>
              Browse verified, approved property listings.
            </p>
          </div>

          {!loading && !loadError && (
            <span className="listing-count">
              {filteredProperties.length}{" "}
              {filteredProperties.length === 1
                ? "property"
                : "properties"}
            </span>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="empty-results">
            <h3>Loading properties...</h3>
            <p>Finding stays for your next trip.</p>
          </div>
        ) : loadError ? (

          /* ERROR STATE */
          <div className="empty-results">
            <h3>Unable to load properties</h3>
            <p role="alert">{loadError}</p>
            <p>
              Please make sure the backend is running
              on port 5001.
            </p>
          </div>
        ) : filteredProperties.length === 0 ? (

          /* EMPTY STATE */
          <div className="empty-results">
            <h3>No properties found</h3>

            <p>
              {appliedFilters
                ? "Try another location or adjust your guest count."
                : "No approved properties are available yet."}
            </p>

            {appliedFilters && (
              <button
                type="button"
                className="primary-btn"
                onClick={resetSearch}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (

          /* REAL PROPERTY GRID */
          <div className="property-grid">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
