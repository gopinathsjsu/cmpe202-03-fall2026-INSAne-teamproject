require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { pool } = require("./config/db");

// ==========================================
// IMPORT API ROUTES
// ==========================================
const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

// ==========================================
// INITIALIZE EXPRESS
// ==========================================
const app = express();

// Use environment port or local default.
const PORT = process.env.PORT || 5001;

const NODE_ENV =
  process.env.NODE_ENV || "development";

// ==========================================
// FRONTEND CORS CONFIGURATION
// ==========================================

// Supports one or multiple comma-separated
// frontend URLs from the environment.
//
// Example:
// FRONTEND_URL=http://localhost:5173
//
// Production example:
// FRONTEND_URL=https://your-frontend.example.com

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header,
      // such as curl and server-to-server requests.
      // Authentication still applies to
      // protected API endpoints.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS origin not allowed")
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ==========================================
// JSON REQUEST BODY MIDDLEWARE
// ==========================================

// Parse JSON before registering routes.
app.use(
  express.json({
    limit: "1mb",
  })
);

// ==========================================
// ROOT ENDPOINT
// ==========================================
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Welcome to Insane Stays API",
    status: "running",
    environment: NODE_ENV,
  });
});

// ==========================================
// APPLICATION HEALTH CHECK
// GET /api/health
// ==========================================
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    status: "healthy",
    service: "Insane Stays Backend",
  });
});

// ==========================================
// POSTGRESQL HEALTH CHECK
// GET /api/db-health
// ==========================================
app.get("/api/db-health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      status: "connected",
      database: "PostgreSQL",
    });

  } catch (error) {
    console.error(
      "Database health check failed:",
      error.message
    );

    return res.status(503).json({
      status: "disconnected",
      database: "PostgreSQL",
    });
  }
});

// ==========================================
// API ROUTES
// ==========================================

// Customer and host registration,
// login, and authentication.
app.use("/api/auth", authRoutes);

// Public property listings,
// host create/update/delete.
app.use("/api/properties", propertyRoutes);

// Admin property approval and rejection.
app.use("/api/admin", adminRoutes);

// Customer reservations,
// cancellations, and host bookings.
app.use("/api/bookings", bookingRoutes);

// ==========================================
// HANDLE UNKNOWN ROUTES
// ==========================================
app.use((req, res) => {
  return res.status(404).json({
    message: "API endpoint not found",
  });
});

// ==========================================
// CENTRALIZED ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error("Express error:", err.message);

  if (err.message === "CORS origin not allowed") {
    return res.status(403).json({
      message: "Origin not allowed",
    });
  }

  // Invalid JSON request body.
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      message: "Invalid JSON request body",
    });
  }

  // JSON payload exceeds configured limit.
  if (err.status === 413) {
    return res.status(413).json({
      message: "Request body too large",
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
});

// ==========================================
// START EXPRESS SERVER
// ==========================================
const server = app.listen(PORT, () => {
  console.log(
    `Insane Stays backend running on port ${PORT}`
  );

  console.log(`Environment: ${NODE_ENV}`);

  console.log(
    `Allowed frontend origins: ${allowedOrigins.join(", ")}`
  );
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);

  server.close(async () => {
    try {
      await pool.end();

      console.log(
        "PostgreSQL connections closed."
      );

      process.exit(0);

    } catch (error) {
      console.error(
        "Shutdown error:",
        error.message
      );

      process.exit(1);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
