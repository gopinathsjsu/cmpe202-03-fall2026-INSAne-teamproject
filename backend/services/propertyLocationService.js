const { pool } = require("../config/db");
const { geocodeAddress } = require("./geocodingService");

// ==========================================
// UPDATE PROPERTY LOCATION
// Geocodes a property row and stores its
// coordinates. Resolves to the coordinates,
// or null when nothing was stored.
// ==========================================
async function updatePropertyLocation(property) {
  const coordinates = await geocodeAddress({
    address: property.address,
    city: property.city,
    state: property.state,
    zipCode: property.zip_code,
  });

  if (!coordinates) {
    return null;
  }

  // Only store the result if the address has not
  // changed while the lookup was in progress.
  const result = await pool.query(
    `UPDATE properties
     SET latitude = $1,
         longitude = $2
     WHERE id = $3
       AND address IS NOT DISTINCT FROM $4
       AND city = $5
       AND state = $6
       AND zip_code IS NOT DISTINCT FROM $7
     RETURNING id`,
    [
      coordinates.latitude,
      coordinates.longitude,
      property.id,
      property.address,
      property.city,
      property.state,
      property.zip_code,
    ]
  );

  return result.rows.length > 0 ? coordinates : null;
}

// ==========================================
// QUEUE PROPERTY LOCATION UPDATE
// Runs in the background so saving a listing
// never waits on, or fails because of, Google.
// ==========================================
function queuePropertyLocationUpdate(property) {
  updatePropertyLocation(property).catch((error) => {
    console.error(
      "Property location update failed:",
      error.message
    );
  });
}

module.exports = {
  updatePropertyLocation,
  queuePropertyLocationUpdate,
};
