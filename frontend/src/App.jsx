
import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Shared Components
import Navbar from "./components/Navbar.jsx";

// Customer Pages
import Home from "./pages/Home.jsx";
import PropertyDetails from "./pages/PropertyDetails.jsx";
import MyBookings from "./pages/MyBookings.jsx";

// Authentication Pages
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

// Dashboard Pages
import Dashboard from "./pages/Dashboard.jsx";
import HostDashboard from "./pages/HostDashboard.jsx";

// Host Management Pages
import AddListing from "./pages/AddListing.jsx";
import EditListing from "./pages/EditListing.jsx";

// Authentication Service
import { getCurrentUser } from "./services/auth.js";

export default function App() {
  const [user, setUser] = useState(getCurrentUser);

  // Redirect users to their appropriate dashboard
  function getDashboardPath(role) {
    if (role === "host") return "/host";
    return "/dashboard";
  }

  return (
    <BrowserRouter>
      {/* Navigation Bar */}
      <Navbar
        user={user}
        onLogout={() => setUser(null)}
      />

      <Routes>
        {/* Customer Homepage */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* Login */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to={getDashboardPath(user.role)}
                replace
              />
            ) : (
              <Login onLogin={setUser} />
            )
          }
        />

        {/* Registration */}
        <Route
          path="/register"
          element={
            user ? (
              <Navigate
                to={getDashboardPath(user.role)}
                replace
              />
            ) : (
              <Register onLogin={setUser} />
            )
          }
        />

        {/* General Dashboard */}
        <Route
          path="/dashboard"
          element={
            user ? (
              user.role === "host" ? (
                <Navigate to="/host" replace />
              ) : (
                <Dashboard user={user} />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Property Details and Booking */}
        <Route
          path="/properties/:id"
          element={
            <PropertyDetails user={user} />
          }
        />

        {/* Customer Booking Management */}
        <Route
          path="/my-bookings"
          element={
            user?.role === "customer" ? (
              <MyBookings user={user} />
            ) : (
              <Navigate
                to={user ? getDashboardPath(user.role) : "/login"}
                replace
              />
            )
          }
        />

        {/* Host Dashboard */}
        <Route
          path="/host"
          element={
            user?.role === "host" ? (
              <HostDashboard user={user} />
            ) : (
              <Navigate
                to={user ? getDashboardPath(user.role) : "/login"}
                replace
              />
            )
          }
        />

        {/* Add New Listing */}
        <Route
          path="/host/add-listing"
          element={
            user?.role === "host" ? (
              <AddListing user={user} />
            ) : (
              <Navigate
                to={user ? getDashboardPath(user.role) : "/login"}
                replace
              />
            )
          }
        />

        {/* Edit Existing Listing */}
        <Route
          path="/host/edit-listing/:id"
          element={
            user?.role === "host" ? (
              <EditListing user={user} />
            ) : (
              <Navigate
                to={user ? getDashboardPath(user.role) : "/login"}
                replace
              />
            )
          }
        />

        {/* Redirect Unknown URLs */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
