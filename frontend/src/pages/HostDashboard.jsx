
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getHostListings,
  deleteListing,
} from "../services/listings.js";

export default function HostDashboard({ user }) {
  const [listings, setListings] = useState(() =>
    getHostListings(user.id)
  );

  const [error, setError] = useState("");

  const approved = listings.filter(
    (listing) => listing.status === "approved"
  ).length;

  const pending = listings.filter(
    (listing) => listing.status === "pending"
  ).length;

  const totalBookings = listings.reduce(
    (sum, listing) => sum + (listing.bookings || 0),
    0
  );

  function handleDelete(listingId) {
    if (!window.confirm("Remove this listing?")) return;

    try {
      deleteListing(listingId, user.id);
      setListings(getHostListings(user.id));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="host-dashboard">
      <div className="host-header">
        <div>
          <span className="eyebrow">HOST MANAGEMENT</span>
          <h1>Welcome back, {user.name}!</h1>
          <p>Manage your vacation rental properties.</p>
        </div>

        <Link to="/host/add-listing" className="primary-btn">
          + Add New Listing
        </Link>
      </div>

      <div className="host-stats">
        <div className="stat-card">
          <span>Total Listings</span>
          <strong>{listings.length}</strong>
        </div>

        <div className="stat-card">
          <span>Approved Listings</span>
          <strong>{approved}</strong>
        </div>

        <div className="stat-card">
          <span>Pending Approval</span>
          <strong>{pending}</strong>
        </div>

        <div className="stat-card">
          <span>Total Bookings</span>
          <strong>{totalBookings}</strong>
        </div>
      </div>

      <section className="host-listings">
        <div className="host-section-heading">
          <h2>My Listings</h2>
          <p>View and manage your rental properties.</p>
        </div>

        {error && <p className="error-message">{error}</p>}

        {listings.length === 0 ? (
          <div className="host-empty">
            <h3>You haven't added any listings yet.</h3>
            <p>Start hosting by adding your first property.</p>
            <Link to="/host/add-listing" className="primary-btn">
              Add your first listing
            </Link>
          </div>
        ) : (
          <div className="host-listing-grid">
            {listings.map((listing) => (
              <article className="host-listing-card" key={listing.id}>
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="host-listing-image"
                />

                <div className="host-listing-content">
                  <div className="host-listing-top">
                    <h3>{listing.title}</h3>
                    <span className={`host-status ${listing.status}`}>
                      {listing.status}
                    </span>
                  </div>

                  <p>{listing.city}, {listing.state}</p>
                  <p>{listing.maxGuests} guests · ${listing.price}/night</p>

                  <div className="host-listing-actions">
                    <Link to={`/host/edit-listing/${listing.id}`}>
                      Edit listing
                    </Link>

                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="host-delete-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
