import { useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ==========================================
// COMPONENTS
// ==========================================
import Navbar from "./components/Navbar";

// ==========================================
// PUBLIC PAGES
// ==========================================
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PropertyDetails from "./pages/PropertyDetails";

// ==========================================
// CUSTOMER PAGES
// ==========================================
import Dashboard from "./pages/Dashboard";
import MyBookings from "./pages/MyBookings";

// ==========================================
// HOST PAGES
// ==========================================
import HostDashboard from "./pages/HostDashboard";
import AddListing from "./pages/AddListing";
import EditListing from "./pages/EditListing";
import HostBookings from "./pages/HostBookings";

// ==========================================
// ADMIN PAGES
// ==========================================
import AdminDashboard from "./pages/AdminDashboard";

// ==========================================
// AUTHENTICATION SERVICES
// ==========================================
import {
  getCurrentUser,
  logoutUser,
} from "./services/auth";

// ==========================================
// HELPER: Determine dashboard by user role
// ==========================================
function getDashboardPath(user) {
  if (user?.role === "host") {
    return "/host";
  }

  if (user?.role === "admin") {
    return "/admin";
  }

  return "/dashboard";
}

// ==========================================
// MAIN APPLICATION
// ==========================================
export default function App() {
  // Load existing authenticated user
  const [user, setUser] = useState(getCurrentUser);

  // ==========================================
  // HANDLE LOGIN
  // ==========================================
  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  // ==========================================
  // HANDLE LOGOUT
  // ==========================================
  const handleLogout = () => {
    // Remove JWT and saved session
    logoutUser();

    // Clear React authentication state
    setUser(null);
  };

  return (
    <BrowserRouter>
      {/* ======================================
          NAVIGATION BAR
      ====================================== */}
      <Navbar
        user={user}
        onLogout={handleLogout}
      />

      <Routes>

        {/* ==================================
            PUBLIC ROUTES
        ================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to={getDashboardPath(user)}
                replace
              />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/register"
          element={
            user ? (
              <Navigate
                to={getDashboardPath(user)}
                replace
              />
            ) : (
              <Register onLogin={handleLogin} />
            )
          }
        />

        <Route
          path="/properties/:id"
          element={<PropertyDetails />}
        />

        {/* ==================================
            CUSTOMER ROUTES
        ================================== */}

        <Route
          path="/dashboard"
          element={
            user?.role === "customer" ? (
              <Dashboard user={user} />
            ) : user ? (
              <Navigate
                to={getDashboardPath(user)}
                replace
              />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/my-bookings"
          element={
            user?.role === "customer" ? (
              <MyBookings user={user} />
            ) : (
              <Navigate
                to={
                  user
                    ? getDashboardPath(user)
                    : "/login"
                }
                replace
              />
            )
          }
        />

        {/* ==================================
            HOST ROUTES
        ================================== */}

        <Route
          path="/host"
          element={
            user?.role === "host" ? (
              <HostDashboard user={user} />
            ) : (
              <Navigate
                to={
                  user
                    ? getDashboardPath(user)
                    : "/login"
                }
                replace
              />
            )
          }
        />

        <Route
          path="/host/add-listing"
          element={
            user?.role === "host" ? (
              <AddListing user={user} />
            ) : (
              <Navigate
                to={
                  user
                    ? getDashboardPath(user)
                    : "/login"
                }
                replace
              />
            )
          }
        />

        <Route
          path="/host/edit-listing/:id"
          element={
            user?.role === "host" ? (
              <EditListing user={user} />
            ) : (
              <Navigate
                to={
                  user
                    ? getDashboardPath(user)
                    : "/login"
                }
                replace
              />
            )
          }
        />

        <Route
          path="/host/bookings"
          element={
            user?.role === "host" ? (
              <HostBookings user={user} />
            ) : (
              <Navigate
                to={
                  user
                    ? getDashboardPath(user)
                    : "/login"
                }
                replace
              />
            )
          }
        />

        {/* ==================================
            ADMIN ROUTES
        ================================== */}

        <Route
          path="/admin"
          element={
            user?.role === "admin" ? (
              <AdminDashboard user={user} />
            ) : (
              <Navigate
                to={
                  user
                    ? getDashboardPath(user)
                    : "/login"
                }
                replace
              />
            )
          }
        />

        {/* ==================================
            UNKNOWN ROUTES
        ================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
