require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { pool } = require("./config/db");

// Import API routes
const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Initialize Express
const app = express();

// Server port
const PORT = process.env.PORT || 5001;

// ==========================================
// MIDDLEWARE
// ==========================================

// Allow requests from React frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

// Parse incoming JSON requests
// Must be registered BEFORE API routes
app.use(express.json());

// ==========================================
// API ROUTES
// ==========================================

// User registration, login, and authentication
app.use("/api/auth", authRoutes);

// Property creation and public listings
app.use("/api/properties", propertyRoutes);

// Administrator property approval and rejection
app.use("/api/admin", adminRoutes);

// ==========================================
// ROOT ENDPOINT
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Insane Stays API",
    status: "running",
  });
});

// ==========================================
// APPLICATION HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Insane Stays Backend",
  });
});

// ==========================================
// POSTGRESQL DATABASE HEALTH CHECK
// ==========================================

app.get("/api/db-health", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time"
    );

    res.json({
      status: "connected",
      database: "PostgreSQL",
      serverTime: result.rows[0].current_time,
    });

  } catch (error) {
    console.error(
      "Database health check failed:",
      error.message
    );

    res.status(503).json({
      status: "disconnected",
      database: "PostgreSQL",
    });
  }
});

// ==========================================
// START EXPRESS SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Insane Stays backend running at http://localhost:${PORT}`
  );
});
