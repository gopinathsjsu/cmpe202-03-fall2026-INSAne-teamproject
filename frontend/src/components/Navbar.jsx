
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  // ==========================================
  // HANDLE LOGOUT
  // ==========================================
  const handleLogout = () => {
    logoutUser();
    onLogout();
    navigate("/");
  };

  // ==========================================
  // DASHBOARD PATH BASED ON ROLE
  // ==========================================
  const dashboardPath =
    user?.role === "host"
      ? "/host"
      : user?.role === "admin"
      ? "/admin"
      : "/dashboard";

  // ==========================================
  // RENDER NAVBAR
  // ==========================================
  return (
    <nav className="navbar">

      {/* WEBSITE LOGO */}
      <Link to="/" className="logo">
        <span className="logo-icon">⌂</span>
        Insane Stays
      </Link>

      <div className="nav-links">

        {/* HOME */}
        <Link to="/">Home</Link>

        {user ? (
          <>
            {/* DASHBOARD */}
            <Link to={dashboardPath}>
              Dashboard
            </Link>

            {/* ==================================
                CUSTOMER NAVIGATION
            ================================== */}
            {user.role === "customer" && (
              <>
                <Link to="/my-bookings">
                  My Bookings
                </Link>

                {/* CUSTOMER MESSAGES */}
                <Link to="/messages">
                  Messages
                </Link>
              </>
            )}

            {/* ==================================
                HOST NAVIGATION
            ================================== */}
            {user.role === "host" && (
              <>
                <Link to="/host">
                  My Listings
                </Link>

                <Link to="/host/add-listing">
                  Add Listing
                </Link>

                <Link to="/host/bookings">
                  My Reservations
                </Link>

                {/* HOST MESSAGING INBOX */}
                <Link to="/messages">
                  Host Inbox
                </Link>
              </>
            )}

            {/* ==================================
                ADMIN NAVIGATION
            ================================== */}
            {user.role === "admin" && (
              <Link to="/admin">
                Admin Dashboard
              </Link>
            )}

            {/* LOGGED-IN USER */}
            <span className="navbar-user">
              Hi, {user.name?.split(" ")[0] || "Guest"}
            </span>

            {/* LOGOUT */}
            <button
              type="button"
              className="outline-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            {/* LOGIN */}
            <Link to="/login">
              Login
            </Link>

            {/* REGISTER */}
            <Link
              to="/register"
              className="nav-signup"
            >
              Register
            </Link>
          </>
        )}

      </div>
    </nav>
  );
}
