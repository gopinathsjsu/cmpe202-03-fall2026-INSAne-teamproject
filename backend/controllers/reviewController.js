const { pool } = require("../config/db");

const validId = (id) => /^[1-9]\d*$/.test(String(id ?? ""));

// GET /api/properties/:id/reviews
const getPropertyReviews = async (req, res) => {
  try {
    const propertyId = req.params.id;

    if (!validId(propertyId)) {
      return res.status(400).json({ message: "Invalid property ID" });
    }

    const property = await pool.query(
      "SELECT id FROM properties WHERE id = $1 AND status = 'approved'",
      [propertyId]
    );

    if (!property.rows.length) {
      return res.status(404).json({ message: "Property not found" });
    }

    const result = await pool.query(
      `SELECT
         r.id,
         r.booking_id,
         r.property_id,
         r.rating,
         r.comment,
         r.created_at,
         r.updated_at,
         u.name AS customer_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.property_id = $1
       ORDER BY r.created_at DESC, r.id DESC`,
      [propertyId]
    );

    const ratings = result.rows.map((r) => Number(r.rating));
    const total = ratings.length;
    const average =
      total === 0
        ? 0
        : Number(
            (ratings.reduce((sum, r) => sum + r, 0) / total).toFixed(1)
          );

    return res.json({
      propertyId,
      averageRating: average,
      totalReviews: total,
      reviews: result.rows
    });
  } catch (error) {
    console.error("Get property reviews error:", error.message);
    return res.status(500).json({
      message: "Failed to retrieve property reviews"
    });
  }
};

// GET /api/reviews/mine
const getMyReviews = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         r.id,
         r.booking_id,
         r.property_id,
         r.rating,
         r.comment,
         r.created_at,
         r.updated_at,
         p.title AS property_title
       FROM reviews r
       JOIN properties p ON p.id = r.property_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC, r.id DESC`,
      [req.user.id]
    );

    return res.json({ reviews: result.rows });
  } catch (error) {
    console.error("Get my reviews error:", error.message);
    return res.status(500).json({
      message: "Failed to retrieve your reviews"
    });
  }
};

// POST /api/reviews
const createReview = async (req, res) => {
  const { bookingId, rating, comment } = req.body || {};

  if (!validId(bookingId)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  if (
    typeof rating !== "number" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    return res.status(400).json({
      message: "Rating must be an integer between 1 and 5"
    });
  }

  if (
    typeof comment !== "string" ||
    [...comment.trim()].length < 10 ||
    [...comment.trim()].length > 2000
  ) {
    return res.status(400).json({
      message: "Comment must contain between 10 and 2000 characters"
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Lock booking while checking eligibility so cancellation
    // cannot change its status during review creation.
    const bookingResult = await client.query(
      `SELECT id, user_id, property_id, status, check_out
       FROM bookings
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [bookingId, req.user.id]
    );

    if (!bookingResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Booking not found"
      });
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== "confirmed") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Cancelled bookings cannot be reviewed"
      });
    }

    // Let PostgreSQL compare DATE values using its own clock.
    const eligibility = await client.query(
      "SELECT $1::date < CURRENT_DATE AS completed",
      [booking.check_out]
    );

    if (!eligibility.rows[0].completed) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "You can review this stay after its checkout date"
      });
    }

    const existing = await client.query(
      "SELECT id FROM reviews WHERE booking_id = $1",
      [bookingId]
    );

    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "You have already reviewed this booking"
      });
    }

    const result = await client.query(
      `INSERT INTO reviews
        (booking_id, user_id, property_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        booking.id,
        req.user.id,
        booking.property_id,
        rating,
        comment.trim()
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Review submitted successfully",
      review: result.rows[0]
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    if (error.code === "23505") {
      return res.status(409).json({
        message: "You have already reviewed this booking"
      });
    }

    if (error.code === "23514") {
      return res.status(400).json({
        message: "Review does not meet database validation rules"
      });
    }

    console.error("Create review error:", error.message);

    return res.status(500).json({
      message: "Failed to submit review"
    });
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  getPropertyReviews,
  getMyReviews,
  createReview
};
