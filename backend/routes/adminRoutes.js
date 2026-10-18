const express = require("express");

const {
  getPendingProperties,
  approveProperty,
  rejectProperty
} = require("../controllers/adminController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// All admin routes require authentication
// and the administrator role
router.use(authenticate);
router.use(authorize("admin"));

// View pending properties
router.get("/properties/pending", getPendingProperties);

// Approve a property
router.patch("/properties/:id/approve", approveProperty);

// Reject a property
router.patch("/properties/:id/reject", rejectProperty);

module.exports = router;
