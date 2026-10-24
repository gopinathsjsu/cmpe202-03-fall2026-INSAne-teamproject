const { pool } = require("../config/db");

// ==========================================
// VALIDATION HELPERS
// ==========================================
const isPositiveId = (id) =>
  /^[1-9]\d*$/.test(String(id));

const isValidIsoDate = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
};

const isValidTime = (value) =>
  typeof value === "string" &&
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const localToday = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

// ==========================================
// VALIDATE PROPERTY BODY
// ==========================================
function validatePropertyBody(
  body,
  { creating = false } = {}
) {
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
    image,
    address,
    contactInfo,
    availableFrom,
    availableTo,
    checkInTime,
    checkOutTime,
  } = body || {};

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof city !== "string" ||
    !city.trim() ||
    typeof state !== "string" ||
    !state.trim()
  ) {
    return {
      error: "Title, city, and state are required",
    };
  }

  const numericPrice = Number(price);

  if (
    price === undefined ||
    price === null ||
    price === "" ||
    !Number.isFinite(numericPrice) ||
    numericPrice < 0
  ) {
    return {
      error: "Price must be a valid non-negative number",
    };
  }

  const numericGuests = Number(guests);

  if (
    guests === undefined ||
    guests === null ||
    guests === "" ||
    !Number.isInteger(numericGuests) ||
    numericGuests < 1
  ) {
    return {
      error: "Guests must be a positive whole number",
    };
  }

  const numericBedrooms = Number(bedrooms);

  if (
    bedrooms === undefined ||
    bedrooms === null ||
    bedrooms === "" ||
    !Number.isInteger(numericBedrooms) ||
    numericBedrooms < 0
  ) {
    return {
      error: "Bedrooms must be a non-negative whole number",
    };
  }

  if (
    amenities !== undefined &&
    (
      !Array.isArray(amenities) ||
      !amenities.every(
        (item) => typeof item === "string"
      )
    )
  ) {
    return {
      error: "Amenities must be an array of strings",
    };
  }

  const optionalTextFields = [
    description,
    zipCode,
    image,
    address,
    contactInfo,
  ];

  if (
    optionalTextFields.some(
      (value) =>
        value !== undefined &&
        value !== null &&
        typeof value !== "string"
    )
  ) {
    return {
      error: "Optional text fields must contain strings or null",
    };
  }

  if (
    zipCode &&
    !/^\d{5}$/.test(zipCode.trim())
  ) {
    return {
      error: "ZIP code must contain 5 digits",
    };
  }

  // Existing edits without schedule fields
  // preserve the current availability window.
  const hasScheduleField = [
    availableFrom,
    availableTo,
    checkInTime,
    checkOutTime,
  ].some((value) => value !== undefined);

  if (creating || hasScheduleField) {
    if (
      !isValidIsoDate(availableFrom) ||
      !isValidIsoDate(availableTo) ||
      availableTo <= availableFrom
    ) {
      return {
        error:
          "Provide valid availability dates; Available Until must be after Available From",
      };
    }

    if (
      creating &&
      availableFrom < localToday()
    ) {
      return {
        error:
          "Availability start date cannot be in the past",
      };
    }

    if (
      !isValidTime(checkInTime) ||
      !isValidTime(checkOutTime)
    ) {
      return {
        error:
          "Check-in/out times must use HH:MM (24-hour) format",
      };
    }
  }

  return {
    values: {
      title: title.trim(),
      description: description?.trim() || null,
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode?.trim() || null,
      price: numericPrice,
      guests: numericGuests,
      bedrooms: numericBedrooms,
      amenities: JSON.stringify(amenities || []),
      image: image?.trim() || null,
      address: address?.trim() || null,
      contactInfo: contactInfo?.trim() || null,
      schedule:
        hasScheduleField || creating
          ? {
              availableFrom,
              availableTo,
              checkInTime,
              checkOutTime,
            }
          : null,
    },
  };
}

// ==========================================
// POST /api/properties
// HOST: CREATE PROPERTY
// ==========================================
const createProperty = async (req, res) => {
  try {
    const validation = validatePropertyBody(
      req.body,
      { creating: true }
    );

    if (validation.error) {
      return res.status(400).json({
        message: validation.error,
      });
    }

    const p = validation.values;

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
        status,
        address,
        contact_info,
        available_from,
        available_to,
        check_in_time,
        check_out_time
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        'pending',
        $12, $13, $14, $15, $16, $17
      )
      RETURNING *`,
      [
        req.user.id,
        p.title,
        p.description,
        p.city,
        p.state,
        p.zipCode,
        p.price,
        p.guests,
        p.bedrooms,
        p.amenities,
        p.image,
        p.address,
        p.contactInfo,
        p.schedule.availableFrom,
        p.schedule.availableTo,
        p.schedule.checkInTime,
        p.schedule.checkOutTime,
      ]
    );

    return res.status(201).json({
      message: "Property submitted for approval",
      property: result.rows[0],
    });

  } catch (error) {
    console.error("Create property error:", error);

    return res.status(500).json({
      message: "Failed to create property",
    });
  }
};

// ==========================================
// GET /api/properties/mine
// HOST: GET OWN PROPERTIES
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
      properties: result.rows,
    });

  } catch (error) {
    console.error("Get host properties error:", error);

    return res.status(500).json({
      message: "Failed to retrieve properties",
    });
  }
};

// ==========================================
// PUBLIC PROPERTY COLUMNS
// Exclude private address and contact info
// ==========================================
const publicColumns = `
  id,
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
  status,
  created_at,
  available_from,
  available_to,
  check_in_time,
  check_out_time
`;

// ==========================================
// GET /api/properties
// PUBLIC: APPROVED PROPERTIES
// ==========================================
const getApprovedProperties = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${publicColumns}
       FROM properties
       WHERE status = 'approved'
       ORDER BY created_at DESC, id DESC`
    );

    return res.status(200).json({
      properties: result.rows,
    });

  } catch (error) {
    console.error("Get approved properties error:", error);

    return res.status(500).json({
      message: "Failed to retrieve properties",
    });
  }
};

// ==========================================
// GET /api/properties/:id
// PUBLIC: APPROVED PROPERTY DETAILS
// ==========================================
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isPositiveId(id)) {
      return res.status(400).json({
        message: "Invalid property ID",
      });
    }

    const result = await pool.query(
      `SELECT ${publicColumns}
       FROM properties
       WHERE id = $1
         AND status = 'approved'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found",
      });
    }

    return res.status(200).json({
      property: result.rows[0],
    });

  } catch (error) {
    console.error("Get property error:", error);

    return res.status(500).json({
      message: "Failed to retrieve property",
    });
  }
};

// ==========================================
// PUT /api/properties/:id
// HOST: UPDATE OWN PROPERTY
// ==========================================
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isPositiveId(id)) {
      return res.status(400).json({
        message: "Invalid property ID",
      });
    }

    const validation = validatePropertyBody(req.body);

    if (validation.error) {
      return res.status(400).json({
        message: validation.error,
      });
    }

    const p = validation.values;
    const schedule = p.schedule;

    // Prevent excluding already confirmed stays.
    if (schedule) {
      const conflict = await pool.query(
        `SELECT 1
         FROM bookings
         WHERE property_id = $1
           AND status = 'confirmed'
           AND (
             check_in < $2::date
             OR check_out > $3::date
           )
         LIMIT 1`,
        [
          id,
          schedule.availableFrom,
          schedule.availableTo,
        ]
      );

      if (conflict.rows.length > 0) {
        return res.status(409).json({
          message:
            "Availability change conflicts with an existing confirmed booking",
        });
      }
    }

    const result = await pool.query(
      `UPDATE properties
       SET
         title = $1,
         description = $2,
         city = $3,
         state = $4,
         zip_code = $5,
         price_per_night = $6,
         max_guests = $7,
         bedrooms = $8,
         amenities = $9,
         image_url = $10,
         address = COALESCE($11, address),
         contact_info = COALESCE($12, contact_info),
         available_from = COALESCE($13, available_from),
         available_to = COALESCE($14, available_to),
         check_in_time = COALESCE($15, check_in_time),
         check_out_time = COALESCE($16, check_out_time),
         status = 'pending'
       WHERE id = $17
         AND host_id = $18
       RETURNING *`,
      [
        p.title,
        p.description,
        p.city,
        p.state,
        p.zipCode,
        p.price,
        p.guests,
        p.bedrooms,
        p.amenities,
        p.image,
        p.address,
        p.contactInfo,
        schedule?.availableFrom || null,
        schedule?.availableTo || null,
        schedule?.checkInTime || null,
        schedule?.checkOutTime || null,
        id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found or access denied",
      });
    }

    return res.status(200).json({
      message:
        "Property updated and submitted for approval",
      property: result.rows[0],
    });

  } catch (error) {
    console.error("Update property error:", error);

    return res.status(500).json({
      message: "Failed to update property",
    });
  }
};

// ==========================================
// DELETE /api/properties/:id
// HOST: DELETE OWN PROPERTY
// ==========================================
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isPositiveId(id)) {
      return res.status(400).json({
        message: "Invalid property ID",
      });
    }

    // Never delete properties with booking history.
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
        property: result.rows[0],
      });
    }

    const owned = await pool.query(
      `SELECT id
       FROM properties
       WHERE id = $1 AND host_id = $2`,
      [id, req.user.id]
    );

    if (owned.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found or access denied",
      });
    }

    return res.status(409).json({
      message:
        "Cannot delete a property with booking history",
    });

  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Cannot delete a property with booking history",
      });
    }

    console.error("Delete property error:", error);

    return res.status(500).json({
      message: "Failed to delete property",
    });
  }
};

// ==========================================
// EXPORT ALL PROPERTY CONTROLLERS
// ==========================================
module.exports = {
  createProperty,
  getMyProperties,
  getApprovedProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
};
