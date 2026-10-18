
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    onLogout();
    navigate("/");
  };

  const dashboardPath =
    user?.role === "host"
      ? "/host"
      : user?.role === "admin"
      ? "/admin"
      : "/dashboard";

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <span className="logo-icon">⌂</span>
        Insane Stays
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>

        {user ? (
          <>
            <Link to={dashboardPath}>Dashboard</Link>

            {user.role === "customer" && (
              <Link to="/my-bookings">My Bookings</Link>
            )}

            {user.role === "host" && (
              <>
                <Link to="/host">My Listings</Link>
                <Link to="/host/add-listing">
                  Add Listing
                </Link>
                <Link to="/host/bookings">
                  My Reservations
                </Link>
              </>
            )}

            {user.role === "admin" && (
              <Link to="/admin">Admin Dashboard</Link>
            )}

            <span className="navbar-user">
              Hi, {user.name?.split(" ")[0] || "Guest"}
            </span>

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
            <Link to="/login">Login</Link>
            <Link to="/register" className="nav-signup">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
