
const express = require("express");

const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getHostBookings
} = require("../controllers/bookingController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// CUSTOMER BOOKING ROUTES
// ==========================================

// GET /api/bookings/mine
// Customer: View own reservations
router.get(
  "/mine",
  authenticate,
  authorize("customer"),
  getMyBookings
);

// POST /api/bookings
// Customer: Create a reservation
router.post(
  "/",
  authenticate,
  authorize("customer"),
  createBooking
);

// PATCH /api/bookings/:id/cancel
// Customer: Cancel own reservation
router.patch(
  "/:id/cancel",
  authenticate,
  authorize("customer"),
  cancelBooking
);

// ==========================================
// HOST BOOKING ROUTES
// ==========================================

// GET /api/bookings/host
// Host: View reservations for owned properties
router.get(
  "/host",
  authenticate,
  authorize("host"),
  getHostBookings
);

module.exports = router;
