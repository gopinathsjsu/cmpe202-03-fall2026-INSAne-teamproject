import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getHostBookings } from "../services/bookings";
import { getMyHostProperties } from "../services/hostProperties";

// ==========================================
// FORMAT DATE
// ==========================================
function formatDate(value) {
  if (!value) return "";

  return String(value).slice(0, 10);
}

// ==========================================
// FORMAT CURRENCY
// ==========================================
function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

// ==========================================
// CALCULATE NUMBER OF NIGHTS
// ==========================================
function calculateNights(checkIn, checkOut) {
  const start = new Date(
    `${formatDate(checkIn)}T00:00:00Z`
  );

  const end = new Date(
    `${formatDate(checkOut)}T00:00:00Z`
  );

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  return Math.round(
    (end.getTime() - start.getTime()) / 86400000
  );
}

// ==========================================
// GET TODAY IN LOCAL TIME
// ==========================================
function getToday() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

// ==========================================
// DETERMINE DISPLAY STATUS
// ==========================================
function getBookingStatus(booking) {
  if (booking.status === "cancelled") {
    return "cancelled";
  }

  const today = getToday();

  if (booking.check_out <= today) {
    return "completed";
  }

  if (booking.check_in > today) {
    return "upcoming";
  }

  return "ongoing";
}

// ==========================================
// HOST BOOKINGS PAGE
// ==========================================
export default function HostBookings({ user }) {
  const navigate = useNavigate();

  const [hostListings, setHostListings] = useState([]);
  const [hostBookings, setHostBookings] = useState([]);

  const [selectedStatus, setSelectedStatus] =
    useState("all");

  const [selectedProperty, setSelectedProperty] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH BOOKINGS AND PROPERTIES
  // ==========================================
  useEffect(() => {
    let active = true;

    async function loadHostBookings() {
      setLoading(true);
      setError("");

      try {
        const [bookingsData, propertiesData] =
          await Promise.all([
            getHostBookings(),
            getMyHostProperties(),
          ]);

        if (!active) return;

        setHostBookings(
          [...bookingsData].sort((a, b) =>
            String(b.check_in).localeCompare(
              String(a.check_in)
            )
          )
        );

        setHostListings(propertiesData);
      } catch (err) {
        if (active) {
          setError(
            err.message ||
              "Failed to load host reservations."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (user?.role === "host") {
      loadHostBookings();
    } else {
      setError("Only hosts can view reservations.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  // ==========================================
  // NORMALIZE BACKEND DATA
  // ==========================================
  const bookings = hostBookings.map((booking) => ({
    ...booking,

    propertyId: String(booking.property_id),
    propertyTitle: booking.property_title,

    checkIn: formatDate(booking.check_in),
    checkOut: formatDate(booking.check_out),

    total: Number(booking.total_price || 0),

    customerName:
      booking.customer_name || "Guest",

    customerEmail:
      booking.customer_email || "",

    nights: calculateNights(
      booking.check_in,
      booking.check_out
    ),
  }));

  // ==========================================
  // FILTER RESERVATIONS
  // ==========================================
  const filteredBookings = bookings.filter(
    (booking) => {
      const matchesStatus =
        selectedStatus === "all" ||
        getBookingStatus(booking) === selectedStatus;

      const matchesProperty =
        selectedProperty === "all" ||
        booking.propertyId === selectedProperty;

      return matchesStatus && matchesProperty;
    }
  );

  // ==========================================
  // STATISTICS
  // ==========================================
  const confirmedBookings = bookings.filter(
    (booking) => booking.status === "confirmed"
  );

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "cancelled"
  );

  const totalRevenue = confirmedBookings.reduce(
    (sum, booking) => sum + booking.total,
    0
  );

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="host-bookings-page">

      {/* BACK BUTTON */}
      <button
        type="button"
        className="back-button"
        onClick={() => navigate("/host")}
      >
        ← Back to Host Dashboard
      </button>

      <h1>Property Reservations</h1>

      <p>
        View reservations for your Insane Stays properties.
      </p>

      {/* ERROR */}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {/* STATISTICS */}
      <div className="host-booking-stats">

        <div className="host-booking-stat">
          <h3>Total Reservations</h3>

          <strong>
            {loading ? "..." : bookings.length}
          </strong>
        </div>

        <div className="host-booking-stat">
          <h3>Confirmed Reservations</h3>

          <strong>
            {loading
              ? "..."
              : confirmedBookings.length}
          </strong>
        </div>

        <div className="host-booking-stat">
          <h3>Cancelled Reservations</h3>

          <strong>
            {loading
              ? "..."
              : cancelledBookings.length}
          </strong>
        </div>

        <div className="host-booking-stat">
          <h3>Confirmed Booking Value</h3>

          <strong>
            {loading
              ? "..."
              : formatCurrency(totalRevenue)}
          </strong>
        </div>

      </div>

      {/* FILTERS */}
      <div className="host-booking-filters">

        <div>
          <label htmlFor="booking-status">
            Booking Status
          </label>

          <select
            id="booking-status"
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(event.target.value)
            }
            disabled={loading}
          >
            <option value="all">
              All Reservations
            </option>

            <option value="upcoming">
              Upcoming
            </option>

            <option value="ongoing">
              Ongoing
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>
        </div>

        <div>
          <label htmlFor="booking-property">
            Property
          </label>

          <select
            id="booking-property"
            value={selectedProperty}
            onChange={(event) =>
              setSelectedProperty(event.target.value)
            }
            disabled={loading}
          >
            <option value="all">
              All Properties
            </option>

            {hostListings.map((listing) => (
              <option
                key={listing.id}
                value={String(listing.id)}
              >
                {listing.title}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="host-bookings-empty">
          <h3>Loading reservations...</h3>

          <p>
            Retrieving your bookings from PostgreSQL.
          </p>
        </div>
      ) : error && bookings.length === 0 ? (
        <div className="host-bookings-empty">
          <h3>Unable to load reservations</h3>
          <p>Check the error above and try again.</p>
        </div>
      ) : filteredBookings.length === 0 ? (

        /* EMPTY STATE */
        <div className="host-bookings-empty">
          <h3>No reservations found</h3>

          <p>
            {selectedStatus !== "all" ||
            selectedProperty !== "all"
              ? "No reservations match your selected filters."
              : "Reservations will appear here when customers book your approved properties."}
          </p>
        </div>

      ) : (

        /* BOOKING LIST */
        <div className="host-booking-list">

          {filteredBookings.map((booking) => {
            const displayStatus =
              getBookingStatus(booking);

            return (
              <div
                className="host-booking-card"
                key={booking.id}
              >

                {/* BOOKING HEADER */}
                <div className="host-booking-card-header">

                  <h3>{booking.propertyTitle}</h3>

                  <span
                    className={`host-booking-status ${displayStatus}`}
                  >
                    {displayStatus}
                  </span>

                </div>

                {/* CUSTOMER INFORMATION */}
                <p>
                  <strong>Customer:</strong>{" "}
                  {booking.customerName}
                </p>

                {booking.customerEmail && (
                  <p>
                    <strong>Email:</strong>{" "}
                    {booking.customerEmail}
                  </p>
                )}

                {/* RESERVATION INFORMATION */}
                <p>
                  <strong>Check-in:</strong>{" "}
                  {booking.checkIn}
                </p>

                <p>
                  <strong>Check-out:</strong>{" "}
                  {booking.checkOut}
                </p>

                <p>
                  <strong>Guests:</strong>{" "}
                  {booking.guests}
                </p>

                <p>
                  <strong>Nights:</strong>{" "}
                  {booking.nights}
                </p>

                <p>
                  <strong>Booking Total:</strong>{" "}
                  {formatCurrency(booking.total)}
                </p>

                <p>
                  <strong>Reservation ID:</strong>{" "}
                  {booking.id}
                </p>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}
