import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getHostListings,
  deleteListing,
} from "../services/listings";
import { getBookings } from "../services/bookingavailability";

export default function HostDashboard({ user }) {
  const [listings, setListings] = useState(() =>
    getHostListings(user?.id)
  );

  const [bookings] = useState(() => getBookings());

  // Refresh listings after deleting a property
  const handleDelete = (listingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) return;

    deleteListing(listingId, user?.id);
    setListings(getHostListings(user?.id));
  };

  // Listing statistics
  const totalListings = listings.length;

  const approvedListings = listings.filter(
    (listing) => listing.status === "approved"
  ).length;

  const pendingListings = listings.filter(
    (listing) => listing.status === "pending"
  ).length;

  // Find reservations belonging to this host
  const hostPropertyIds = new Set(
    listings.map((listing) => String(listing.id))
  );

  const hostBookings = bookings.filter((booking) =>
    hostPropertyIds.has(String(booking.propertyId))
  );

  // Local calendar date in YYYY-MM-DD format
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  // Reservation statistics
  const totalReservations = hostBookings.length;

  const upcomingReservations = hostBookings.filter(
    (booking) =>
      booking.status === "confirmed" &&
      booking.checkIn > today
  ).length;

  const cancelledReservations = hostBookings.filter(
    (booking) => booking.status === "cancelled"
  ).length;

  const totalBookingValue = hostBookings
    .filter((booking) => booking.status === "confirmed")
    .reduce(
      (sum, booking) => sum + Number(booking.total || 0),
      0
    );

  return (
    <div className="host-dashboard">
      {/* Header */}
      <div className="host-header">
        <div>
          <h1>Host Dashboard</h1>
          <p>
            Manage your properties and monitor reservations.
          </p>
        </div>

        <Link
          to="/host/add-listing"
          className="primary-btn"
        >
          + Add New Listing
        </Link>
      </div>

      {/* Listing Statistics */}
      <div className="host-section-heading">
        <h2>Property Overview</h2>
        <p>Current status of your property listings.</p>
      </div>

      <div className="host-stats">
        <div className="stat-card">
          <span>Total Listings</span>
          <strong>{totalListings}</strong>
        </div>

        <div className="stat-card">
          <span>Approved Listings</span>
          <strong>{approvedListings}</strong>
        </div>

        <div className="stat-card">
          <span>Pending Listings</span>
          <strong>{pendingListings}</strong>
        </div>

        <div className="stat-card">
          <span>Total Reservations</span>
          <strong>{totalReservations}</strong>
        </div>
      </div>

      {/* Reservation Statistics */}
      <div className="host-section-heading">
        <h2>Reservation Overview</h2>
        <p>
          Booking activity for your properties.
        </p>
      </div>

      <div className="host-stats">
        <div className="stat-card">
          <span>Upcoming Reservations</span>
          <strong>{upcomingReservations}</strong>
        </div>

        <div className="stat-card">
          <span>Cancelled Reservations</span>
          <strong>{cancelledReservations}</strong>
        </div>

        <div className="stat-card">
          <span>Confirmed Reservations</span>
          <strong>
            {
              hostBookings.filter(
                (booking) =>
                  booking.status === "confirmed"
              ).length
            }
          </strong>
        </div>

        <div className="stat-card">
          <span>Total Booking Value</span>
          <strong>
            ${totalBookingValue.toLocaleString()}
          </strong>
        </div>
      </div>

      <div style={{ marginBottom: "45px" }}>
        <Link
          to="/host/bookings"
          className="primary-btn"
        >
          View All Reservations
        </Link>
      </div>

      {/* Property Listings */}
      <div className="host-section-heading">
        <h2>My Listings</h2>
        <p>
          View, edit, or remove your properties.
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="host-empty">
          <h3>No listings yet</h3>
          <p>
            Create your first property listing to get
            started.
          </p>

          <Link
            to="/host/add-listing"
            className="primary-btn"
          >
            Add Your First Listing
          </Link>
        </div>
      ) : (
        <div className="host-listing-grid">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="host-listing-card"
            >
              {listing.image && (
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="host-listing-image"
                />
              )}

              <div className="host-listing-content">
                <div className="host-listing-top">
                  <h3>{listing.title}</h3>

                  <span
                    className={`host-status ${
                      listing.status || "pending"
                    }`}
                  >
                    {listing.status || "pending"}
                  </span>
                </div>

                <p>
                  {listing.city}, {listing.state}
                </p>

                <p>
                  <strong>
                    ${Number(
                      listing.price || 0
                    ).toLocaleString()}
                  </strong>{" "}
                  / night
                </p>

                <p>
                  {listing.guests} guests ·{" "}
                  {listing.bedrooms} bedrooms
                </p>

                <div className="host-listing-actions">
                  <Link
                    to={`/host/edit-listing/${listing.id}`}
                  >
                    Edit
                  </Link>

                  <button
                    type="button"
                    className="host-delete-btn"
                    onClick={() =>
                      handleDelete(listing.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
