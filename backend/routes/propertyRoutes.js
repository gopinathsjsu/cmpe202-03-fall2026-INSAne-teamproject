const express = require("express");

const {
  createProperty,
  getMyProperties,
  getApprovedProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
} = require("../controllers/propertyController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Retrieve all approved properties
router.get("/", getApprovedProperties);

// ==========================================
// HOST ROUTES
// ==========================================

// Retrieve properties belonging to host
router.get(
  "/mine",
  authenticate,
  authorize("host"),
  getMyProperties
);

// Create a new property
router.post(
  "/",
  authenticate,
  authorize("host"),
  createProperty
);

// Update a property belonging to host
router.put(
  "/:id",
  authenticate,
  authorize("host"),
  updateProperty
);

// Delete a property belonging to host
router.delete(
  "/:id",
  authenticate,
  authorize("host"),
  deleteProperty
);

// ==========================================
// PUBLIC PROPERTY DETAILS
// ==========================================

// Retrieve one approved property
router.get("/:id", getPropertyById);

module.exports = router;
