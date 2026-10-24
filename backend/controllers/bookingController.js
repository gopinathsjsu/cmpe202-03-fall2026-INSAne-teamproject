
const { pool } = require("../config/db");

// ==========================================
// HELPER: Validate YYYY-MM-DD dates
// ==========================================
const parseDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
};

// ==========================================
// POST /api/bookings
// Customer: Create a reservation
// ==========================================
const createBooking = async (req, res) => {
  try {
    const {
      propertyId,
      checkIn,
      checkOut,
      guests
    } = req.body || {};

    // Validate property ID
    if (!/^[1-9]\d*$/.test(String(propertyId))) {
      return res.status(400).json({
        message: "Invalid property ID"
      });
    }

    // Validate guest count
    if (
      guests === undefined ||
      guests === null ||
      guests === "" ||
      !Number.isInteger(Number(guests)) ||
      Number(guests) < 1
    ) {
      return res.status(400).json({
        message: "Guests must be a positive whole number"
      });
    }

    // Validate dates
    const startDate = parseDate(checkIn);
    const endDate = parseDate(checkOut);

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Dates must use YYYY-MM-DD format"
      });
    }

    // Calculate nights
    const nights =
      (endDate.getTime() - startDate.getTime()) /
      86400000;

    // Enforce 1-14 night limit
    if (nights < 1 || nights > 14) {
      return res.status(400).json({
        message: "Bookings must be between 1 and 14 nights"
      });
    }

    // Prevent past check-in dates
    const today = new Date().toISOString().slice(0, 10);

    if (checkIn < today) {
      return res.status(400).json({
        message: "Check-in cannot be in the past"
      });
    }

    // Find approved property
    const propertyResult = await pool.query(
      `SELECT
         id,
         price_per_night,
         max_guests
       FROM properties
       WHERE id = $1
         AND status = 'approved'`,
      [propertyId]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found or not approved"
      });
    }

    const property = propertyResult.rows[0];

    // Validate guest capacity
    if (Number(guests) > property.max_guests) {
      return res.status(400).json({
        message: "Guest count exceeds property capacity"
      });
    }

    // Calculate total price securely on backend
    const nightlyCents = Math.round(
      Number(property.price_per_night) * 100
    );

    const totalPrice = (
      (nightlyCents * nights) / 100
    ).toFixed(2);

    // Create reservation
    // PostgreSQL constraint prevents double booking
    const result = await pool.query(
      `INSERT INTO bookings (
         user_id,
         property_id,
         check_in,
         check_out,
         guests,
         total_price,
         status
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, 'confirmed'
       )
       RETURNING *`,
      [
        req.user.id,
        propertyId,
        checkIn,
        checkOut,
        Number(guests),
        totalPrice
      ]
    );

    return res.status(201).json({
      message: "Booking created successfully",
      booking: result.rows[0]
    });

  } catch (error) {
    // PostgreSQL overlap constraint violation
    if (error.code === "23P01") {
      return res.status(409).json({
        message: "Property is unavailable for the selected dates"
      });
    }

    console.error("Create booking error:", error.message);

    return res.status(500).json({
      message: "Failed to create booking"
    });
  }
};

// ==========================================
// GET /api/bookings/mine
// Customer: Retrieve own reservations
// ==========================================
const getMyBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         b.id,
         b.user_id,
         b.property_id,
         TO_CHAR(b.check_in, 'YYYY-MM-DD') AS check_in,
         TO_CHAR(b.check_out, 'YYYY-MM-DD') AS check_out,
         b.guests,
         b.total_price,
         b.status,
         b.created_at,
         p.title AS property_title,
         p.city,
         p.state,
         p.image_url
       FROM bookings b
       JOIN properties p
         ON b.property_id = p.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC, b.id DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      bookings: result.rows
    });

  } catch (error) {
    console.error("Get my bookings error:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve bookings"
    });
  }
};

// ==========================================
// PATCH /api/bookings/:id/cancel
// Customer: Cancel own reservation
// ==========================================
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate booking ID
    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid booking ID"
      });
    }

    // Cancel only confirmed bookings
    // belonging to logged-in customer
    const result = await pool.query(
      `UPDATE bookings
       SET status = 'cancelled'
       WHERE id = $1
         AND user_id = $2
         AND status = 'confirmed'
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length > 0) {
      return res.status(200).json({
        message: "Booking cancelled successfully",
        booking: result.rows[0]
      });
    }

    // Check whether booking belongs to customer
    const bookingResult = await pool.query(
      `SELECT id, status
       FROM bookings
       WHERE id = $1
         AND user_id = $2`,
      [id, req.user.id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        message: "Booking not found or access denied"
      });
    }

    return res.status(409).json({
      message: "Booking is already cancelled"
    });

  } catch (error) {
    console.error("Cancel booking error:", error.message);

    return res.status(500).json({
      message: "Failed to cancel booking"
    });
  }
};

// ==========================================
// GET /api/bookings/host
// Host: View reservations for owned properties
// ==========================================
const getHostBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         b.id,
         b.property_id,
         b.user_id,
         TO_CHAR(b.check_in, 'YYYY-MM-DD') AS check_in,
         TO_CHAR(b.check_out, 'YYYY-MM-DD') AS check_out,
         b.guests,
         b.total_price,
         b.status,
         b.created_at,
         p.title AS property_title,
         p.city,
         p.state,
         u.name AS customer_name,
         u.email AS customer_email
       FROM bookings b
       JOIN properties p
         ON b.property_id = p.id
       JOIN users u
         ON b.user_id = u.id
       WHERE p.host_id = $1
       ORDER BY b.created_at DESC, b.id DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      bookings: result.rows
    });

  } catch (error) {
    console.error("Get host bookings error:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve host bookings"
    });
  }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================
module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  getHostBookings
};
