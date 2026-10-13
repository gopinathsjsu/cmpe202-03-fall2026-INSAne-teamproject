
import { useState } from "react";
import SearchBar from "../components/SearchBar";
import PropertyCard from "../components/PropertyCard";
import { properties } from "../data/properties";

export default function Home() {
  const [filteredProperties, setFilteredProperties] = useState(properties);
  const [search, setSearch] = useState(null);
  const [message, setMessage] = useState("");

  function handleSearch(filters) {
    setSearch(filters);
    setMessage("");

    const results = properties.filter((property) => {
      const matchesLocation =
        !filters.location ||
        `${property.title} ${property.city} ${property.state} ${property.zipCode}`
          .toLowerCase()
          .includes(filters.location);

      const matchesGuests = property.guests >= filters.guests;

      return matchesLocation && matchesGuests;
    });

    setFilteredProperties(results);
  }

  function handleBook(property) {
    setMessage(
      `Booking for ${property.title} will be available when we add the booking page.`
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="rental-home">
      <section className="hero-section">
        <div className="hero-content">
          <span className="eyebrow">EXPLORE · DISCOVER · STAY</span>
          <h1>Find some insane places to stay </h1>
          <p>
            Discover beautiful vacation homes and unforgettable
            destinations for your next getaway.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} />
      </section>

      <section className="listings-section">
        {message && (
          <div className="booking-notice" role="status">
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        <div className="listings-heading">
          <div>
            <h2>Explore amazing stays</h2>
            <p>
              {search
                ? `${filteredProperties.length} matching properties`
                : "Handpicked vacation rentals for your next trip"}
            </p>
          </div>
          <span className="listing-count">
            {filteredProperties.length} stays
          </span>
        </div>

        {filteredProperties.length > 0 ? (
          <div className="property-grid">
            {filteredProperties.map((property) => (
            <PropertyCard
                key={property.id}
                property={property}
            />
            ))}
          </div>
        ) : (
          <div className="empty-results">
            <h3>No properties found</h3>
            <p>Try another location or fewer guests.</p>
            <button
              className="primary-btn"
              onClick={() => {
                setFilteredProperties(properties);
                setSearch(null);
              }}
            >
              Show all stays
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
