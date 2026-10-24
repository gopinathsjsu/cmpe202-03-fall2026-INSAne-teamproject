import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/auth";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // HANDLE LOGIN
  // ==========================================
  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      // Authenticate through Node.js backend
      const user = await loginUser(email, password);

      // Update application authentication state
      if (onLogin) {
        onLogin(user);
      }

      // Redirect based on account role
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "host") {
        navigate("/host");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message || "Login failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Log in to your Insane Stays account</p>
        </div>

        <form onSubmit={handleSubmit}>

          <label htmlFor="email">
            Email address
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
            required
          />

          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
            required
          />

          {error && (
            <p
              className="error-message"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>

        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">
            Sign up
          </Link>
        </div>

      </div>
    </main>
  );
}
