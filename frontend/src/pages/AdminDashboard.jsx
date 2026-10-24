import { useCallback, useEffect, useState } from "react";

import {
  getPendingProperties,
  getApprovedProperties,
  approveProperty,
  rejectProperty,
} from "../services/adminProperties";

// ==========================================
// PRICE FORMATTER
// ==========================================
function formatPrice(price) {
  return Number(price || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================
export default function AdminDashboard() {
  const [pendingListings, setPendingListings] =
    useState([]);

  const [approvedListings, setApprovedListings] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] =
    useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ==========================================
  // FETCH LIVE PROPERTY DATA
  // ==========================================
  const loadListings = useCallback(async () => {
    const [pending, approved] = await Promise.all([
      getPendingProperties(),
      getApprovedProperties(),
    ]);

    setPendingListings(pending);
    setApprovedListings(approved);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      setLoading(true);

      try {
        const [pending, approved] = await Promise.all([
          getPendingProperties(),
          getApprovedProperties(),
        ]);

        if (active) {
          setPendingListings(pending);
          setApprovedListings(approved);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || "Failed to load admin dashboard."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================
  // HANDLE APPROVE OR REJECT
  // ==========================================
  async function updateListingStatus(listing, status) {
    if (processingId !== null) return;

    const action =
      status === "approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${listing.title}"?`
    );

    if (!confirmed) return;

    setProcessingId(listing.id);
    setError("");
    setMessage("");

    try {
      if (status === "approved") {
        await approveProperty(listing.id);
      } else {
        await rejectProperty(listing.id);
      }

      // Update the pending list after the
      // backend confirms the action.
      setPendingListings((previous) =>
        previous.filter(
          (item) =>
            String(item.id) !== String(listing.id)
        )
      );

      setMessage(
        `"${listing.title}" was ${
          status === "approved" ? "approved" : "rejected"
        } successfully.`
      );

      // Reload actual values from PostgreSQL.
      try {
        await loadListings();
      } catch (refreshError) {
        setError(
          `Action succeeded, but refreshing the dashboard failed: ${refreshError.message}`
        );
      }

    } catch (err) {
      setError(
        err.message || `Failed to ${action} property.`
      );

    } finally {
      setProcessingId(null);
    }
  }

  // ==========================================
  // REFRESH BUTTON
  // ==========================================
  async function handleRefresh() {
    setLoading(true);
    setError("");

    try {
      await loadListings();
    } catch (err) {
      setError(
        err.message || "Failed to refresh listings."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // AVAILABLE LISTING COUNTS
  // ==========================================
  const totalVisible =
    pendingListings.length +
    approvedListings.length;

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="admin-dashboard">

      <h1>Admin Dashboard</h1>

      <p>
        Manage property listings and approvals.
      </p>

      {/* REFRESH BUTTON */}
      <button
        type="button"
        className="primary-btn"
        onClick={handleRefresh}
        disabled={loading || processingId !== null}
        style={{ marginBottom: "20px" }}
      >
        {loading ? "Refreshing..." : "Refresh Listings"}
      </button>

      {/* ERROR MESSAGE */}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {/* SUCCESS MESSAGE */}
      {message && (
        <p role="status">
          {message}
        </p>
      )}

      {/* ADMIN STATISTICS */}
      <div className="admin-stats">

        <div className="admin-stat-card">
          <h3>Visible Listings</h3>
          <h2>{loading ? "..." : totalVisible}</h2>
        </div>

        <div className="admin-stat-card">
          <h3>Pending Approvals</h3>
          <h2>
            {loading ? "..." : pendingListings.length}
          </h2>
        </div>

        <div className="admin-stat-card">
          <h3>Approved Listings</h3>
          <h2>
            {loading ? "..." : approvedListings.length}
          </h2>
        </div>

      </div>

      <p style={{ marginBottom: "24px" }}>
        Statistics include pending and approved listings.
        Rejected listings are not included.
      </p>

      {/* ======================================
          PENDING APPROVALS
      ====================================== */}
      <h2>Pending Property Approvals</h2>

      {loading ? (
        <p>Loading pending properties...</p>
      ) : pendingListings.length === 0 ? (
        <p>No pending listings.</p>
      ) : (
        <div className="admin-listings">

          {pendingListings.map((listing) => (
            <div
              className="admin-listing-card"
              key={listing.id}
            >

              {/* PROPERTY IMAGE */}
              {listing.image_url ? (
                <img
                  src={listing.image_url}
                  alt={listing.title}
                  className="admin-listing-image"
                />
              ) : (
                <div
                  className="admin-listing-image"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#f3f3f3",
                    color: "#777",
                    padding: "20px",
                  }}
                >
                  No property image
                </div>
              )}

              <div className="admin-listing-info">

                <h3>{listing.title}</h3>

                <p>
                  {listing.city}, {listing.state}
                </p>

                <p>
                  {formatPrice(listing.price_per_night)}
                  {" / night"}
                </p>

                <p>
                  Maximum Guests: {listing.max_guests}
                </p>

                <p>
                  Bedrooms: {listing.bedrooms}
                </p>

                {listing.description && (
                  <p>{listing.description}</p>
                )}

                {/* AMENITIES */}
                {Array.isArray(listing.amenities) &&
                  listing.amenities.length > 0 && (
                    <p>
                      Amenities:{" "}
                      {listing.amenities.join(", ")}
                    </p>
                  )}

                {/* AVAILABILITY */}
                {listing.available_from &&
                  listing.available_to && (
                    <p>
                      Availability:{" "}
                      {String(listing.available_from).slice(0, 10)}
                      {" to "}
                      {String(listing.available_to).slice(0, 10)}
                    </p>
                  )}

                <p>
                  Status: <strong>{listing.status}</strong>
                </p>

                {/* ADMIN ACTIONS */}
                <div className="admin-actions">

                  <button
                    type="button"
                    className="admin-approve-btn"
                    onClick={() =>
                      updateListingStatus(
                        listing,
                        "approved"
                      )
                    }
                    disabled={processingId !== null}
                  >
                    {processingId === listing.id
                      ? "Processing..."
                      : "Approve"}
                  </button>

                  <button
                    type="button"
                    className="admin-reject-btn"
                    onClick={() =>
                      updateListingStatus(
                        listing,
                        "rejected"
                      )
                    }
                    disabled={processingId !== null}
                  >
                    {processingId === listing.id
                      ? "Processing..."
                      : "Reject"}
                  </button>

                </div>
              </div>
            </div>
          ))}

        </div>
      )}

      {/* ======================================
          APPROVED LISTINGS
      ====================================== */}
      <h2>Approved Property Listings</h2>

      {loading ? (
        <p>Loading approved properties...</p>
      ) : approvedListings.length === 0 ? (
        <p>No approved listings.</p>
      ) : (
        <div className="admin-listings">

          {approvedListings.map((listing) => (
            <div
              className="admin-listing-card"
              key={listing.id}
            >

              <div className="admin-listing-info">

                <h3>{listing.title}</h3>

                <p>
                  {listing.city}, {listing.state}
                </p>

                <p>
                  {formatPrice(listing.price_per_night)}
                  {" / night"}
                </p>

                <p>
                  Status:{" "}
                  <strong>{listing.status}</strong>
                </p>

              </div>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}
