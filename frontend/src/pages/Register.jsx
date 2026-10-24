import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/auth";

export default function Register({ onLogin }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // HANDLE INPUT CHANGES
  // ==========================================
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ==========================================
  // HANDLE REGISTRATION
  // ==========================================
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (loading) return;

    // Validate full name
    if (form.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    // Validate password length
    if (form.password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    // Confirm passwords match
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Register user through Node.js backend
      // Then automatically log in
      const user = await registerUser(form);

      // Update React authentication state
      if (onLogin) {
        onLogin(user);
      }

      // Redirect based on actual account role
      if (user.role === "host") {
        navigate("/host");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.message ||
        "Registration failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <h1>Create an account</h1>
          <p>
            Join Insane Stays and find your next getaway
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Full Name */}
          <label htmlFor="name">
            Full name
          </label>

          <input
            id="name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            disabled={loading}
            required
          />

          {/* Email */}
          <label htmlFor="register-email">
            Email address
          </label>

          <input
            id="register-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            disabled={loading}
            required
          />

          {/* Account Role */}
          <label htmlFor="role">
            I want to
          </label>

          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="customer">
              Book vacation rentals
            </option>

            <option value="host">
              List my property
            </option>
          </select>

          {/* Password */}
          <label htmlFor="register-password">
            Password
          </label>

          <input
            id="register-password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            disabled={loading}
            required
          />

          {/* Confirm Password */}
          <label htmlFor="confirmPassword">
            Confirm password
          </label>

          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            disabled={loading}
            required
          />

          {/* Error Message */}
          {error && (
            <p
              className="error-message"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Create account"}
          </button>

        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">
            Log in
          </Link>
        </div>

      </div>
    </main>
  );
}
