
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth.js";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  // Log out and return to the homepage
  function handleLogout() {
    logoutUser();
    onLogout();
    navigate("/");
  }

  // Determine the dashboard based on the user's role
  function getDashboardPath() {
    if (user?.role === "host") {
      return "/host";
    }

    return "/dashboard";
  }

  return (
    <header className="navbar">
      {/* Website Logo */}
      <Link to="/" className="logo">
        <span className="logo-icon">⌂</span>
        Insane Stays
      </Link>

      {/* Navigation Links */}
      <nav className="nav-links" aria-label="Main navigation">
        {user ? (
          <>
            {/* Dashboard */}
            <Link to={getDashboardPath()}>
              Dashboard
            </Link>

            {/* Customer Navigation */}
            {user.role === "customer" && (
              <Link to="/my-bookings">
                My Bookings
              </Link>
            )}

            {/* Host Navigation */}
            {user.role === "host" && (
              <>
                <Link to="/host">
                  My Listings
                </Link>

                <Link to="/host/add-listing">
                  Add Listing
                </Link>
              </>
            )}

            {/* User Greeting */}
            <span className="user-greeting">
              Hi, {user?.name?.split(" ")[0] || "Guest"}
            </span>

            {/* Logout */}
            <button
              type="button"
              className="outline-btn"
              onClick={handleLogout}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            {/* Login */}
            <Link to="/login">
              Log in
            </Link>

            {/* Registration */}
            <Link to="/register" className="nav-signup">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
