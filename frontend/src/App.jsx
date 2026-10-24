import { useEffect, useState } from "react";

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
  getTokenExpirationMs,
  logoutUser,
} from "./services/auth";

// ==========================================
// HELPER: DASHBOARD FOR USER ROLE
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
  // Load and validate saved session.
  const [user, setUser] = useState(getCurrentUser);

  // ==========================================
  // HANDLE LOGIN
  // ==========================================
  function handleLogin(loggedInUser) {
    // Re-read validated session from auth.js.
    const session = getCurrentUser();

    setUser(session || null);

    if (!session) {
      console.warn(
        "Login session is missing or expired."
      );
    }
  }

  // ==========================================
  // HANDLE LOGOUT
  // ==========================================
  function handleLogout() {
    logoutUser();
    setUser(null);
  }

  // ==========================================
  // AUTOMATIC SESSION EXPIRATION
  // ==========================================
  useEffect(() => {
    if (!user) return;

    const expiration = getTokenExpirationMs();

    if (expiration === null) {
      logoutUser();
      setUser(null);
      return;
    }

    const millisecondsUntilExpiration =
      expiration - Date.now();

    if (millisecondsUntilExpiration <= 0) {
      logoutUser();
      setUser(null);
      return;
    }

    // Schedule logout when JWT expires.
    // Delay is capped for browser timer limits.
    const timeoutId = window.setTimeout(() => {
      setUser(getCurrentUser());
    }, Math.min(
      millisecondsUntilExpiration + 100,
      2147483647
    ));

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [user]);

  // ==========================================
  // CHECK SESSION ON TAB FOCUS,
  // VISIBILITY CHANGE, AND OTHER TABS
  // ==========================================
  useEffect(() => {
    function refreshSession() {
      const currentUser = getCurrentUser();

      setUser((previous) => {
        if (
          !previous &&
          !currentUser
        ) {
          return previous;
        }

        if (
          previous?.id === currentUser?.id &&
          previous?.role === currentUser?.role &&
          previous?.name === currentUser?.name &&
          previous?.email === currentUser?.email
        ) {
          return previous;
        }

        return currentUser;
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshSession();
      }
    }

    function handleStorage(event) {
      if (
        event.key === "rental_app_token" ||
        event.key === "rental_app_session" ||
        event.key === null
      ) {
        refreshSession();
      }
    }

    window.addEventListener(
      "focus",
      refreshSession
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "focus",
        refreshSession
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  // ==========================================
  // RENDER APPLICATION
  // ==========================================
  return (
    <BrowserRouter>

      {/* NAVIGATION BAR */}
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
              <Navigate to="/login" replace />
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
            <Navigate to="/" replace />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
