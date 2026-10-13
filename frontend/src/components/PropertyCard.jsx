
import { Link } from "react-router-dom";

export default function PropertyCard({ property }) {
  return (
    <article className="property-card">
      <Link to={`/properties/${property.id}`}>
        <div className="property-image-container">
          <img
            src={property.image}
            alt={property.title}
            className="property-image"
          />
          <span className="property-badge">
            Guest favorite
          </span>
        </div>
      </Link>

      <div className="property-details">
        <div className="property-title-row">
          <h3>
            {property.city}, {property.state}
          </h3>
          <span className="property-rating">
            ★ {property.rating}
          </span>
        </div>

        <p className="property-name">{property.title}</p>

        <p className="property-info">
          {property.guests} guests · {property.bedrooms} bedrooms
        </p>

        <p className="property-amenities">
          {property.amenities.join(" · ")}
        </p>

        <p className="property-reviews">
          {property.reviews} reviews
        </p>

        <p className="property-bookings">
          Booked {property.bookedToday} times today
        </p>

        <div className="property-bottom">
          <p className="property-price">
            <strong>${property.price}</strong> / night
          </p>

          <Link
            to={`/properties/${property.id}`}
            className="book-button"
          >
            Book now
          </Link>
        </div>
      </div>
    </article>
  );
}
