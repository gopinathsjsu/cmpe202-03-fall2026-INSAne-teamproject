import { useState } from "react";
import PropertyCard from "../components/PropertyCard";
import { getAvailableProperties } from "../services/properties";

export default function Home() {
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [searchApplied, setSearchApplied] = useState(false);
  const [error, setError] = useState("");

  // Get demo properties and approved host listings.
  const properties = getAvailableProperties();

  // Get today's date in local time.
  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Calculate nights without timezone-related date errors.
  const calculateNights = (start, end) => {
    if (!start || !end) return 0;

    const startDate = Date.parse(`${start}T00:00:00Z`);
    const endDate = Date.parse(`${end}T00:00:00Z`);

    return Math.round(
      (endDate - startDate) / (1000 * 60 * 60 * 24)
    );
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setError("");

    if (checkIn && checkOut) {
      const nights = calculateNights(checkIn, checkOut);

      if (checkIn < getToday()) {
        setError("Check-in date cannot be in the past.");
        return;
      }

      if (nights <= 0) {
        setError("Check-out must be after check-in.");
        return;
      }

      if (nights > 14) {
        setError("Bookings cannot exceed 14 nights.");
        return;
      }
    } else if (checkIn || checkOut) {
      setError("Please select both check-in and check-out dates.");
      return;
    }

    if (Number(guests) < 1) {
      setError("Please select at least one guest.");
      return;
    }

    setSearchApplied(true);
  };

  const handleReset = () => {
    setLocation("");
    setCheckIn("");
    setCheckOut("");
    setGuests(1);
    setSearchApplied(false);
    setError("");
  };

  // Filter properties using the submitted search criteria.
  const [appliedFilters, setAppliedFilters] = useState(null);

  const submitSearch = (event) => {
    event.preventDefault();
    setError("");

    if (checkIn && checkOut) {
      const nights = calculateNights(checkIn, checkOut);

      if (checkIn < getToday()) {
        setError("Check-in date cannot be in the past.");
        return;
      }

      if (nights <= 0) {
        setError("Check-out must be after check-in.");
        return;
      }

      if (nights > 14) {
        setError("Bookings cannot exceed 14 nights.");
        return;
      }
    } else if (checkIn || checkOut) {
      setError("Please select both check-in and check-out dates.");
      return;
    }

    const guestCount = Number(guests);

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      setError("Please enter a valid number of guests.");
      return;
    }

    setAppliedFilters({
      location: location.trim().toLowerCase(),
      guests: guestCount,
      checkIn,
      checkOut,
    });

    setSearchApplied(true);
  };

  const resetSearch = () => {
    setLocation("");
    setCheckIn("");
    setCheckOut("");
    setGuests(1);
    setAppliedFilters(null);
    setSearchApplied(false);
    setError("");
  };

  const filteredProperties = properties.filter((property) => {
    if (!searchApplied || !appliedFilters) {
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
      locationText.includes(appliedFilters.location);

    const matchesGuests =
      Number(property.guests) >= appliedFilters.guests;

    // Actual booked-date availability will be checked by the backend.
    return matchesLocation && matchesGuests;
  });

  return (
    <main className="home-page">
      <section className="hero">
        <h1>Find your next unforgettable stay</h1>
        <p>
          Discover beautiful homes, unique getaways, and places
          you'll love with Insane Stays.
        </p>

        <form className="search-bar" onSubmit={submitSearch}>
          <div className="search-field">
            <label htmlFor="location">Where</label>
            <input
              id="location"
              type="text"
              placeholder="City, state, or ZIP code"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>

          <div className="search-field">
            <label htmlFor="checkIn">Check-in</label>
            <input
              id="checkIn"
              type="date"
              min={getToday()}
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
            />
          </div>

          <div className="search-field">
            <label htmlFor="checkOut">Check-out</label>
            <input
              id="checkOut"
              type="date"
              min={checkIn || getToday()}
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
            />
          </div>

          <div className="search-field">
            <label htmlFor="guests">Guests</label>
            <input
              id="guests"
              type="number"
              min="1"
              value={guests}
              onChange={(event) => setGuests(event.target.value)}
            />
          </div>

          <button type="submit" className="search-button">
            Search
          </button>
        </form>

        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}

        {searchApplied && (
          <button
            type="button"
            onClick={resetSearch}
            className="reset-button"
          >
            Clear Search
          </button>
        )}
      </section>

      <section className="properties-section">
        <div className="section-heading">
          <h2>
            {searchApplied
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

        {filteredProperties.length === 0 ? (
          <div className="no-results">
            <h3>No properties found</h3>
            <p>
              Try another location or adjust your guest count.
            </p>
          </div>
        ) : (
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