const { pool } = require("../config/db");

// GET /api/admin/properties/pending
const getPendingProperties = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         p.*,
         u.name AS host_name,
         u.email AS host_email
       FROM properties p
       JOIN users u ON p.host_id = u.id
       WHERE p.status = 'pending'
       ORDER BY p.created_at ASC, p.id ASC`
    );

    return res.status(200).json({
      properties: result.rows
    });
  } catch (error) {
    console.error("Get pending properties error:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve pending properties"
    });
  }
};

// PATCH /api/admin/properties/:id/approve
const approveProperty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid property ID"
      });
    }

    const result = await pool.query(
      `UPDATE properties
       SET status = 'approved'
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Pending property not found"
      });
    }

    return res.status(200).json({
      message: "Property approved successfully",
      property: result.rows[0]
    });
  } catch (error) {
    console.error("Approve property error:", error.message);

    return res.status(500).json({
      message: "Failed to approve property"
    });
  }
};

// PATCH /api/admin/properties/:id/reject
const rejectProperty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid property ID"
      });
    }

    const result = await pool.query(
      `UPDATE properties
       SET status = 'rejected'
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Pending property not found"
      });
    }

    return res.status(200).json({
      message: "Property rejected successfully",
      property: result.rows[0]
    });
  } catch (error) {
    console.error("Reject property error:", error.message);

    return res.status(500).json({
      message: "Failed to reject property"
    });
  }
};

module.exports = {
  getPendingProperties,
  approveProperty,
  rejectProperty
};
