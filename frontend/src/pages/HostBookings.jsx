
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHostListings } from "../services/listings";
import { getBookings } from "../services/bookingavailability";

export default function HostBookings({ user }) {
  const navigate = useNavigate();

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProperty, setSelectedProperty] = useState("all");

  const hostListings = getHostListings(user?.id);
  const hostPropertyIds = new Set(
    hostListings.map((listing) => String(listing.id))
  );

  // Only bookings for properties owned by this host.
  const hostBookings = getBookings()
    .filter((booking) =>
      hostPropertyIds.has(String(booking.propertyId))
    )
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn));

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const getBookingStatus = (booking) => {
    if (booking.status === "cancelled") return "cancelled";

    if (booking.checkOut <= todayString) return "completed";

    if (booking.checkIn > todayString) return "upcoming";

    return "ongoing";
  };

  const filteredBookings = hostBookings.filter((booking) => {
    const matchesStatus =
      selectedStatus === "all" ||
      getBookingStatus(booking) === selectedStatus;

    const matchesProperty =
      selectedProperty === "all" ||
      String(booking.propertyId) === selectedProperty;

    return matchesStatus && matchesProperty;
  });

  const confirmedBookings = hostBookings.filter(
    (booking) => booking.status === "confirmed"
  );

  const totalRevenue = confirmedBookings.reduce(
    (sum, booking) => sum + Number(booking.total || 0),
    0
  );

  return (
    <div className="host-bookings-page">
      <button
        className="back-button"
        onClick={() => navigate("/host")}
      >
        ← Back to Host Dashboard
      </button>

      <h1>Property Reservations</h1>
      <p>View and manage reservations for your listings.</p>

      <div className="host-booking-stats">
        <div className="host-booking-stat">
          <h3>Total Reservations</h3>
          <strong>{hostBookings.length}</strong>
        </div>

        <div className="host-booking-stat">
          <h3>Confirmed Reservations</h3>
          <strong>{confirmedBookings.length}</strong>
        </div>

        <div className="host-booking-stat">
          <h3>Cancelled Reservations</h3>
          <strong>
            {
              hostBookings.filter(
                (booking) => booking.status === "cancelled"
              ).length
            }
          </strong>
        </div>

        <div className="host-booking-stat">
          <h3>Confirmed Booking Value</h3>
          <strong>${totalRevenue.toLocaleString()}</strong>
        </div>
      </div>

      <div className="host-booking-filters">
        <div>
          <label htmlFor="booking-status">Booking Status</label>
          <select
            id="booking-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Reservations</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label htmlFor="booking-property">Property</label>
          <select
            id="booking-property"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
          >
            <option value="all">All Properties</option>

            {hostListings.map((listing) => (
              <option key={listing.id} value={String(listing.id)}>
                {listing.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="host-bookings-empty">
          <h3>No reservations found</h3>
          <p>
            Reservations will appear here when customers book
            your approved properties.
          </p>
        </div>
      ) : (
        <div className="host-booking-list">
          {filteredBookings.map((booking) => (
            <div className="host-booking-card" key={booking.id}>
              <div className="host-booking-card-header">
                <h3>{booking.propertyTitle}</h3>

                <span
                  className={`host-booking-status ${getBookingStatus(
                    booking
                  )}`}
                >
                  {getBookingStatus(booking)}
                </span>
              </div>

              <p>
                <strong>Check-in:</strong> {booking.checkIn}
              </p>

              <p>
                <strong>Check-out:</strong> {booking.checkOut}
              </p>

              <p>
                <strong>Guests:</strong> {booking.guests}
              </p>

              <p>
                <strong>Nights:</strong> {booking.nights}
              </p>

              <p>
                <strong>Booking Total:</strong> $
                {Number(booking.total || 0).toLocaleString()}
              </p>

              <p>
                <strong>Reservation ID:</strong> {booking.id}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
