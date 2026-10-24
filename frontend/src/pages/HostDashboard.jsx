import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getMyHostProperties,
  deleteHostProperty,
} from "../services/hostProperties";

import { getHostBookings } from "../services/bookings";

// ==========================================
// HELPER: FORMAT PRICE
// ==========================================
function formatPrice(price) {
  return Number(price || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

// ==========================================
// HOST DASHBOARD
// ==========================================
export default function HostDashboard({ user }) {
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  // ==========================================
  // LOAD HOST DATA FROM POSTGRESQL
  // ==========================================
  useEffect(() => {
    let active = true;

    async function loadHostData() {
      setLoading(true);
      setError("");

      try {
        const [propertiesData, bookingsData] =
          await Promise.all([
            getMyHostProperties(),
            getHostBookings(),
          ]);

        if (active) {
          setListings(propertiesData);
          setBookings(bookingsData);
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || "Failed to load host dashboard."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHostData();

    return () => {
      active = false;
    };
  }, [user?.id]);

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================
  const approved = listings.filter(
    (listing) => listing.status === "approved"
  ).length;

  const pending = listings.filter(
    (listing) => listing.status === "pending"
  ).length;

  const totalBookings = bookings.length;

  // ==========================================
  // DELETE HOST PROPERTY
  // ==========================================
  async function handleDelete(listingId) {
    if (deletingId !== null) return;

    const confirmed = window.confirm(
      "Are you sure you want to remove this listing?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setDeletingId(listingId);

    try {
      await deleteHostProperty(listingId);

      // Remove listing only after backend confirms deletion
      setListings((previous) =>
        previous.filter(
          (listing) => String(listing.id) !== String(listingId)
        )
      );

      setMessage("Listing removed successfully.");
    } catch (err) {
      setError(
        err.message || "Failed to remove listing."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <main className="host-dashboard">

      {/* HOST HEADER */}
      <div className="host-header">
        <div>
          <span className="eyebrow">
            HOST MANAGEMENT
          </span>

          <h1>
            Welcome back, {user.name}!
          </h1>

          <p>
            Manage your vacation rental properties.
          </p>
        </div>

        <Link
          to="/host/add-listing"
          className="primary-btn"
        >
          + Add New Listing
        </Link>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="booking-notice" role="status">
          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* HOST STATISTICS */}
      <div className="host-stats">

        <div className="stat-card">
          <span>Total Listings</span>
          <strong>
            {loading ? "..." : listings.length}
          </strong>
        </div>

        <div className="stat-card">
          <span>Approved Listings</span>
          <strong>
            {loading ? "..." : approved}
          </strong>
        </div>

        <div className="stat-card">
          <span>Pending Approval</span>
          <strong>
            {loading ? "..." : pending}
          </strong>
        </div>

        <div className="stat-card">
          <span>Total Bookings</span>
          <strong>
            {loading ? "..." : totalBookings}
          </strong>
        </div>

      </div>

      {/* HOST LISTINGS */}
      <section className="host-listings">

        <div className="host-section-heading">
          <h2>My Listings</h2>

          <p>
            View and manage your rental properties.
          </p>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="host-empty">
            <h3>Loading your listings...</h3>
            <p>Retrieving properties from PostgreSQL.</p>
          </div>
        ) : listings.length === 0 && !error ? (

          /* EMPTY STATE */
          <div className="host-empty">
            <h3>You haven't added any listings yet.</h3>

            <p>
              Start hosting by adding your first property.
            </p>

            <Link
              to="/host/add-listing"
              className="primary-btn"
            >
              Add your first listing
            </Link>
          </div>
        ) : listings.length > 0 ? (

          /* LISTING GRID */
          <div className="host-listing-grid">

            {listings.map((listing) => (
              <article
                className="host-listing-card"
                key={listing.id}
              >

                {/* PROPERTY IMAGE */}
                {listing.image_url ? (
                  <img
                    src={listing.image_url}
                    alt={listing.title}
                    className="host-listing-image"
                  />
                ) : (
                  <div
                    className="host-listing-image"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f3f3f3",
                      color: "#777",
                      textAlign: "center",
                      padding: "20px",
                    }}
                  >
                    Property image coming soon
                  </div>
                )}

                <div className="host-listing-content">

                  {/* PROPERTY TITLE AND STATUS */}
                  <div className="host-listing-top">
                    <h3>{listing.title}</h3>

                    <span
                      className={`host-status ${listing.status}`}
                    >
                      {listing.status}
                    </span>
                  </div>

                  {/* LOCATION */}
                  <p>
                    {listing.city}, {listing.state}
                  </p>

                  {/* CAPACITY AND PRICE */}
                  <p>
                    {listing.max_guests}{" "}
                    {Number(listing.max_guests) === 1
                      ? "guest"
                      : "guests"}
                    {" · "}
                    {formatPrice(listing.price_per_night)}
                    /night
                  </p>

                  {/* PROPERTY ACTIONS */}
                  <div className="host-listing-actions">

                    <Link
                      to={`/host/edit-listing/${listing.id}`}
                    >
                      Edit listing
                    </Link>

                    <button
                      type="button"
                      className="host-delete-btn"
                      disabled={deletingId !== null}
                      onClick={() =>
                        handleDelete(listing.id)
                      }
                    >
                      {deletingId === listing.id
                        ? "Removing..."
                        : "Remove"}
                    </button>

                  </div>

                </div>
              </article>
            ))}

          </div>
        ) : null}

      </section>

      {/* HOST RESERVATION LINK */}
      {!loading && (
        <div style={{ marginTop: "35px" }}>
          <Link
            to="/host/bookings"
            className="primary-btn"
          >
            View Guest Reservations
          </Link>
        </div>
      )}

    </main>
  );
}
