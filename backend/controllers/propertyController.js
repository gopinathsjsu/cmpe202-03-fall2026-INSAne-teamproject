const { pool } = require("../config/db");

// ==========================================
// POST /api/properties
// Host: Create a new property
// ==========================================
const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      city,
      state,
      zipCode,
      price,
      guests,
      bedrooms,
      amenities,
      image
    } = req.body || {};

    // Validate required text fields
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof city !== "string" ||
      !city.trim() ||
      typeof state !== "string" ||
      !state.trim()
    ) {
      return res.status(400).json({
        message: "Title, city, and state are required"
      });
    }

    // Validate price
    const numericPrice = Number(price);

    if (
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number"
      });
    }

    // Validate guests
    const numericGuests = Number(guests);

    if (
      guests === undefined ||
      guests === null ||
      guests === "" ||
      !Number.isInteger(numericGuests) ||
      numericGuests < 1
    ) {
      return res.status(400).json({
        message: "Guests must be a positive whole number"
      });
    }

    // Validate bedrooms
    const numericBedrooms = Number(bedrooms);

    if (
      bedrooms === undefined ||
      bedrooms === null ||
      bedrooms === "" ||
      !Number.isInteger(numericBedrooms) ||
      numericBedrooms < 0
    ) {
      return res.status(400).json({
        message: "Bedrooms must be a non-negative whole number"
      });
    }

    // Validate amenities
    if (
      amenities !== undefined &&
      (!Array.isArray(amenities) ||
        !amenities.every(
          (item) => typeof item === "string"
        ))
    ) {
      return res.status(400).json({
        message: "Amenities must be an array of strings"
      });
    }

    // Validate optional text fields
    if (
      [description, zipCode, image].some(
        (value) =>
          value !== undefined &&
          value !== null &&
          typeof value !== "string"
      )
    ) {
      return res.status(400).json({
        message: "Optional text fields must contain strings or null"
      });
    }

    // Insert property with pending status
    const result = await pool.query(
      `INSERT INTO properties (
        host_id,
        title,
        description,
        city,
        state,
        zip_code,
        price_per_night,
        max_guests,
        bedrooms,
        amenities,
        image_url,
        status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, 'pending'
      )
      RETURNING *`,
      [
        req.user.id,
        title.trim(),
        description?.trim() || null,
        city.trim(),
        state.trim(),
        zipCode?.trim() || null,
        numericPrice,
        numericGuests,
        numericBedrooms,
        JSON.stringify(amenities || []),
        image?.trim() || null
      ]
    );

    return res.status(201).json({
      message: "Property submitted for approval",
      property: result.rows[0]
    });

  } catch (error) {
    console.error("Create property error:", error.message);

    return res.status(500).json({
      message: "Failed to create property"
    });
  }
};

// ==========================================
// GET /api/properties/mine
// Host: Retrieve own properties
// ==========================================
const getMyProperties = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM properties
       WHERE host_id = $1
       ORDER BY created_at DESC, id DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      properties: result.rows
    });

  } catch (error) {
    console.error(
      "Get host properties error:",
      error.message
    );

    return res.status(500).json({
      message: "Failed to retrieve properties"
    });
  }
};

// ==========================================
// GET /api/properties
// Public: Retrieve approved properties
// ==========================================
const getApprovedProperties = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM properties
       WHERE status = 'approved'
       ORDER BY created_at DESC, id DESC`
    );

    return res.status(200).json({
      properties: result.rows
    });

  } catch (error) {
    console.error(
      "Get approved properties error:",
      error.message
    );

    return res.status(500).json({
      message: "Failed to retrieve properties"
    });
  }
};

// ==========================================
// GET /api/properties/:id
// Public: Retrieve approved property details
// ==========================================
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid property ID"
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM properties
       WHERE id = $1
         AND status = 'approved'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    return res.status(200).json({
      property: result.rows[0]
    });

  } catch (error) {
    console.error("Get property error:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve property"
    });
  }
};

// ==========================================
// PUT /api/properties/:id
// Host: Update own property
// ==========================================
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid property ID"
      });
    }

    const {
      title,
      description,
      city,
      state,
      zipCode,
      price,
      guests,
      bedrooms,
      amenities,
      image
    } = req.body || {};

    // Validate required text fields
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof city !== "string" ||
      !city.trim() ||
      typeof state !== "string" ||
      !state.trim()
    ) {
      return res.status(400).json({
        message: "Title, city, and state are required"
      });
    }

    // Validate numeric fields
    const numericPrice = Number(price);
    const numericGuests = Number(guests);
    const numericBedrooms = Number(bedrooms);

    if (
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      guests === undefined ||
      guests === null ||
      guests === "" ||
      !Number.isInteger(numericGuests) ||
      numericGuests < 1 ||
      bedrooms === undefined ||
      bedrooms === null ||
      bedrooms === "" ||
      !Number.isInteger(numericBedrooms) ||
      numericBedrooms < 0
    ) {
      return res.status(400).json({
        message: "Invalid price, guests, or bedrooms"
      });
    }

    // Validate amenities
    if (
      amenities !== undefined &&
      (!Array.isArray(amenities) ||
        !amenities.every(
          (item) => typeof item === "string"
        ))
    ) {
      return res.status(400).json({
        message: "Amenities must be an array of strings"
      });
    }

    // Validate optional text fields
    if (
      [description, zipCode, image].some(
        (value) =>
          value !== undefined &&
          value !== null &&
          typeof value !== "string"
      )
    ) {
      return res.status(400).json({
        message: "Optional text fields must contain strings or null"
      });
    }

    // Update property only if it belongs to host
    const result = await pool.query(
      `UPDATE properties
       SET title = $1,
           description = $2,
           city = $3,
           state = $4,
           zip_code = $5,
           price_per_night = $6,
           max_guests = $7,
           bedrooms = $8,
           amenities = $9,
           image_url = $10,
           status = 'pending'
       WHERE id = $11
         AND host_id = $12
       RETURNING *`,
      [
        title.trim(),
        description?.trim() || null,
        city.trim(),
        state.trim(),
        zipCode?.trim() || null,
        numericPrice,
        numericGuests,
        numericBedrooms,
        JSON.stringify(amenities || []),
        image?.trim() || null,
        id,
        req.user.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found or access denied"
      });
    }

    return res.status(200).json({
      message: "Property updated and submitted for approval",
      property: result.rows[0]
    });

  } catch (error) {
    console.error("Update property error:", error.message);

    return res.status(500).json({
      message: "Failed to update property"
    });
  }
};

// ==========================================
// DELETE /api/properties/:id
// Host: Delete own property
// ==========================================
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate property ID
    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: "Invalid property ID"
      });
    }

    // Delete only if:
    // 1. The property belongs to this host
    // 2. The property has no booking history
    const result = await pool.query(
      `DELETE FROM properties
       WHERE id = $1
         AND host_id = $2
         AND NOT EXISTS (
           SELECT 1
           FROM bookings
           WHERE property_id = properties.id
         )
       RETURNING id, title`,
      [id, req.user.id]
    );

    if (result.rows.length > 0) {
      return res.status(200).json({
        message: "Property deleted successfully",
        property: result.rows[0]
      });
    }

    // Check whether property belongs to host
    const propertyResult = await pool.query(
      `SELECT id
       FROM properties
       WHERE id = $1
         AND host_id = $2`,
      [id, req.user.id]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found or access denied"
      });
    }

    // Property exists but has booking history
    return res.status(409).json({
      message: "Cannot delete a property with booking history"
    });

  } catch (error) {
    // Handle concurrent booking insert
    if (error.code === "23503") {
      return res.status(409).json({
        message: "Cannot delete a property with booking history"
      });
    }

    console.error("Delete property error:", error.message);

    return res.status(500).json({
      message: "Failed to delete property"
    });
  }
};

module.exports = {
  createProperty,
  getMyProperties,
  getApprovedProperties,
  getPropertyById,
  updateProperty,
  deleteProperty
};
