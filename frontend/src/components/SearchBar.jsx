
import { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState("");

  // Get today's date in local YYYY-MM-DD format
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

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

      const start = Date.parse(`${checkIn}T00:00:00Z`);
      const end = Date.parse(`${checkOut}T00:00:00Z`);
      const nights = (end - start) / 86400000;

      if (checkIn < today) {
        setError("Check-in cannot be in the past.");
        return;
      }

      if (!Number.isFinite(nights) || nights < 1 || nights > 14) {
        setError("Stays must be between 1 and 14 nights.");
        return;
      }
    }

    if (!Number.isInteger(Number(guests)) || Number(guests) < 1) {
      setError("Please enter a valid number of guests.");
      return;
    }

    onSearch({
      location: location.trim().toLowerCase(),
      checkIn,
      checkOut,
      guests: Number(guests),
    });
  }

  return (
    <form className="search-bar" onSubmit={handleSearch}>
      <div className="search-fields">

        {/* Destination */}
        <div className="search-field location-field">
          <label htmlFor="search-location">Where</label>
          <input
            id="search-location"
            type="text"
            placeholder="City, state, or ZIP code"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Check-in */}
        <div className="search-field">
          <label htmlFor="check-in">Check-in</label>
          <input
            id="check-in"
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </div>

        {/* Check-out */}
        <div className="search-field">
          <label htmlFor="check-out">Check-out</label>
          <input
            id="check-out"
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>

        {/* Guests */}
        <div className="search-field guests-field">
          <label htmlFor="guests">Guests</label>
          <input
            id="guests"
            type="number"
            min="1"
            max="20"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            required
          />
        </div>

        {/* Search button */}
        <button type="submit" className="search-button">
          Search
        </button>

      </div>

      {error && (
        <p className="search-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
