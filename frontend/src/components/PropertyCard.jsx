import { Link } from "react-router-dom";

// ==========================================
// HELPER: FORMAT PRICE
// ==========================================
function formatPrice(price) {
  return Number(price || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

// ==========================================
// HELPER: FORMAT AMENITIES
// ==========================================
function formatAmenities(amenities) {
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
// PROPERTY CARD
// ==========================================
export default function PropertyCard({ property }) {
  const amenities = formatAmenities(property.amenities);

  const maxGuests = Number(property.max_guests) || 1;
  const bedrooms = Number(property.bedrooms) || 1;

  const propertyUrl = `/properties/${property.id}`;

  return (
    <article className="property-card">

      {/* PROPERTY IMAGE */}
      <Link to={propertyUrl}>
        <div className="property-image-container">

          {property.image_url ? (
            <img
              src={property.image_url}
              alt={property.title}
              className="property-image"
              loading="lazy"
            />
          ) : (
            <div
              className="property-image"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f3f3f3",
                color: "#777",
                padding: "20px",
                textAlign: "center",
              }}
            >
              Property image coming soon
            </div>
          )}

        </div>
      </Link>

      {/* PROPERTY INFORMATION */}
      <div className="property-details">

        <div className="property-title-row">
          <h3>
            {property.city}, {property.state}
          </h3>
        </div>

        <p className="property-name">
          {property.title}
        </p>

        {/* GUESTS AND BEDROOMS */}
        <p className="property-info">
          {maxGuests}{" "}
          {maxGuests === 1 ? "guest" : "guests"}
          {" · "}
          {bedrooms}{" "}
          {bedrooms === 1 ? "bedroom" : "bedrooms"}
        </p>

        {/* AMENITIES */}
        {amenities.length > 0 && (
          <p className="property-amenities">
            {amenities.slice(0, 4).join(" · ")}
          </p>
        )}

        {/* PRICE AND BOOK BUTTON */}
        <div className="property-bottom">

          <p className="property-price">
            <strong>
              {formatPrice(property.price_per_night)}
            </strong>{" "}
            / night
          </p>

          <Link
            to={propertyUrl}
            className="book-button"
          >
            Book now
          </Link>

        </div>

      </div>
    </article>
  );
}
