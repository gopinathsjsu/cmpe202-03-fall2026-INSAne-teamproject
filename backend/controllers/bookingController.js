const { pool } = require("../config/db");

// ==========================================
// HELPER: VALIDATE DATES
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
// CUSTOMER: CREATE RESERVATION
// ==========================================
const createBooking = async (req, res) => {
  try {
    const {
      propertyId,
      checkIn,
      checkOut,
      guests,
    } = req.body || {};

    // Validate property and guests.
    if (
      !/^[1-9]\d*$/.test(String(propertyId)) ||
      guests === undefined ||
      guests === null ||
      guests === "" ||
      !Number.isInteger(Number(guests)) ||
      Number(guests) < 1
    ) {
      return res.status(400).json({
        message: "Invalid property ID or guest count",
      });
    }

    // Validate dates.
    const start = parseDate(checkIn);
    const end = parseDate(checkOut);

    if (!start || !end) {
      return res.status(400).json({
        message: "Dates must use YYYY-MM-DD format",
      });
    }

    const nights =
      (end.getTime() - start.getTime()) / 86400000;

    if (nights < 1 || nights > 14) {
      return res.status(400).json({
        message:
          "Bookings must be between 1 and 14 nights",
      });
    }

    const local = new Date();

    const today = [
      local.getFullYear(),
      String(local.getMonth() + 1).padStart(2, "0"),
      String(local.getDate()).padStart(2, "0"),
    ].join("-");

    if (checkIn < today) {
      return res.status(400).json({
        message: "Check-in cannot be in the past",
      });
    }

    // ======================================
    // FIND APPROVED PROPERTY AND SCHEDULE
    // ======================================
    const propertyResult = await pool.query(
      `SELECT
         id,
         price_per_night,
         max_guests,
         TO_CHAR(
           available_from,
           'YYYY-MM-DD'
         ) AS available_from,
         TO_CHAR(
           available_to,
           'YYYY-MM-DD'
         ) AS available_to
       FROM properties
       WHERE id = $1
         AND status = 'approved'`,
      [propertyId]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found or not approved",
      });
    }

    const property = propertyResult.rows[0];

    if (
      Number(guests) >
      Number(property.max_guests)
    ) {
      return res.status(400).json({
        message: "Guest count exceeds property capacity",
      });
    }

    // ======================================
    // VALIDATE HOST AVAILABILITY WINDOW
    // Existing properties without dates
    // remain bookable.
    // ======================================
    if (
      (
        property.available_from &&
        checkIn < property.available_from
      ) ||
      (
        property.available_to &&
        checkOut > property.available_to
      )
    ) {
      return res.status(409).json({
        message:
          "Dates are outside the host's availability window",
      });
    }

    // ======================================
    // CALCULATE TOTAL PRICE
    // ======================================
    const nightlyCents = Math.round(
      Number(property.price_per_night) * 100
    );

    const totalPrice = (
      (nightlyCents * nights) / 100
    ).toFixed(2);

    // ======================================
    // CREATE BOOKING
    // Repeat the property checks in SQL.
    // PostgreSQL also prevents overlapping
    // confirmed reservations.
    // ======================================
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
       SELECT
         $1,
         p.id,
         $3::date,
         $4::date,
         $5,
         $6,
         'confirmed'
       FROM properties p
       WHERE p.id = $2
         AND p.status = 'approved'
         AND (
           p.available_from IS NULL
           OR $3::date >= p.available_from
         )
         AND (
           p.available_to IS NULL
           OR $4::date <= p.available_to
         )
         AND p.max_guests >= $5
       RETURNING *`,
      [
        req.user.id,
        propertyId,
        checkIn,
        checkOut,
        Number(guests),
        totalPrice,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        message:
          "Property is unavailable for the selected dates",
      });
    }

    return res.status(201).json({
      message: "Booking created successfully",
      booking: result.rows[0],
    });

  } catch (error) {
    // PostgreSQL exclusion constraint:
    // overlapping confirmed bookings.
    if (error.code === "23P01") {
      return res.status(409).json({
        message:
          "Property is unavailable for the selected dates",
      });
    }

    console.error("Create booking error:", error);

    return res.status(500).json({
      message: "Failed to create booking",
    });
  }
};

// ==========================================
// GET /api/bookings/mine
// CUSTOMER: GET OWN BOOKINGS
// ==========================================
const getMyBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         b.id,
         b.user_id,
         b.property_id,
         TO_CHAR(
           b.check_in,
           'YYYY-MM-DD'
         ) AS check_in,
         TO_CHAR(
           b.check_out,
           'YYYY-MM-DD'
         ) AS check_out,
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
      bookings: result.rows,
    });

  } catch (error) {
    console.error("Get my bookings error:", error);

    return res.status(500).json({
      message: "Failed to retrieve bookings",
    });
  }
};

// ==========================================
// PATCH /api/bookings/:id/cancel
// CUSTOMER: CANCEL OWN BOOKING
// ==========================================
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid booking ID",
      });
    }

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
        booking: result.rows[0],
      });
    }

    const found = await pool.query(
      `SELECT id, status
       FROM bookings
       WHERE id = $1
         AND user_id = $2`,
      [id, req.user.id]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({
        message: "Booking not found or access denied",
      });
    }

    return res.status(409).json({
      message: "Booking is already cancelled",
    });

  } catch (error) {
    console.error("Cancel booking error:", error);

    return res.status(500).json({
      message: "Failed to cancel booking",
    });
  }
};

// ==========================================
// GET /api/bookings/host
// HOST: VIEW RESERVATIONS
// ==========================================
const getHostBookings = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         b.id,
         b.property_id,
         b.user_id,
         TO_CHAR(
           b.check_in,
           'YYYY-MM-DD'
         ) AS check_in,
         TO_CHAR(
           b.check_out,
           'YYYY-MM-DD'
         ) AS check_out,
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
      bookings: result.rows,
    });

  } catch (error) {
    console.error("Get host bookings error:", error);

    return res.status(500).json({
      message: "Failed to retrieve host bookings",
    });
  }
};

// ==========================================
// EXPORT BOOKING CONTROLLERS
// ==========================================
module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  getHostBookings,
};
