
import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PropertyDetails from "./pages/PropertyDetails";
import MyBookings from "./pages/MyBookings";

import HostDashboard from "./pages/HostDashboard";
import AddListing from "./pages/AddListing";
import EditListing from "./pages/EditListing";
import HostBookings from "./pages/HostBookings";

import AdminDashboard from "./pages/AdminDashboard";

import { getCurrentUser } from "./services/auth";

function getDashboardPath(user) {
  if (user?.role === "host") return "/host";
  if (user?.role === "admin") return "/admin";
  return "/dashboard";
}

export default function App() {
  const [user, setUser] = useState(getCurrentUser);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />

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

        {/* Customer routes */}
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
                to={user ? getDashboardPath(user) : "/login"}
                replace
              />
            )
          }
        />

        {/* Host routes */}
        <Route
          path="/host"
          element={
            user?.role === "host" ? (
              <HostDashboard user={user} />
            ) : (
              <Navigate
                to={user ? getDashboardPath(user) : "/login"}
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
                to={user ? getDashboardPath(user) : "/login"}
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
                to={user ? getDashboardPath(user) : "/login"}
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
                to={user ? getDashboardPath(user) : "/login"}
                replace
              />
            )
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            user?.role === "admin" ? (
              <AdminDashboard user={user} />
            ) : (
              <Navigate
                to={user ? getDashboardPath(user) : "/login"}
                replace
              />
            )
          }
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
