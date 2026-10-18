import { useEffect, useState } from "react";
import {
  getListings,
  updateListing,
  deleteListing,
} from "../services/listings";

export default function AdminDashboard() {
  const [listings, setListings] = useState([]);

  const loadListings = () => {
    setListings(getListings());
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleApprove = (listing) => {
    updateListingStatus(listing, "approved");
  };

  const handleReject = (listing) => {
    updateListingStatus(listing, "rejected");
  };

  const updateListingStatus = (listing, status) => {
    const allListings = getListings();

    const updatedListings = allListings.map((item) =>
      String(item.id) === String(listing.id)
        ? { ...item, status }
        : item
    );

    localStorage.setItem(
      "insane_stays_listings",
      JSON.stringify(updatedListings)
    );

    loadListings();
  };

  const pendingListings = listings.filter(
    (listing) => listing.status === "pending"
  );

  const approvedListings = listings.filter(
    (listing) => listing.status === "approved"
  );

  const rejectedListings = listings.filter(
    (listing) => listing.status === "rejected"
  );

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>Manage property listings and approvals.</p>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <h3>Total Listings</h3>
          <h2>{listings.length}</h2>
        </div>

        <div className="admin-stat-card">
          <h3>Pending Approvals</h3>
          <h2>{pendingListings.length}</h2>
        </div>

        <div className="admin-stat-card">
          <h3>Approved Listings</h3>
          <h2>{approvedListings.length}</h2>
        </div>

        <div className="admin-stat-card">
          <h3>Rejected Listings</h3>
          <h2>{rejectedListings.length}</h2>
        </div>
      </div>

      <h2>Pending Property Approvals</h2>

      {pendingListings.length === 0 ? (
        <p>No pending listings.</p>
      ) : (
        <div className="admin-listings">
          {pendingListings.map((listing) => (
            <div className="admin-listing-card" key={listing.id}>
              {listing.image && (
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="admin-listing-image"
                />
              )}

              <div className="admin-listing-info">
                <h3>{listing.title}</h3>
                <p>
                  {listing.city}, {listing.state}
                </p>
                <p>${listing.price} / night</p>
                <p>Status: {listing.status}</p>

                <div className="admin-actions">
                  <button
                    className="admin-approve-btn"
                    onClick={() => handleApprove(listing)}
                  >
                    Approve
                  </button>

                  <button
                    className="admin-reject-btn"
                    onClick={() => handleReject(listing)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2>All Property Listings</h2>

      <div className="admin-listings">
        {listings.map((listing) => (
          <div className="admin-listing-card" key={listing.id}>
            <div className="admin-listing-info">
              <h3>{listing.title}</h3>
              <p>
                {listing.city}, {listing.state}
              </p>
              <p>Status: {listing.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}