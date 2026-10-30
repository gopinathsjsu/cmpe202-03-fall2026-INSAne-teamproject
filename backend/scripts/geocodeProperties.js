// ==========================================
// BACKFILL PROPERTY COORDINATES
// Geocodes every property that has no
// coordinates yet. Safe to run repeatedly.
//
// Usage: npm run geocode
// ==========================================

require("dotenv").config();

const { pool } = require("../config/db");
const {
  isGeocodingEnabled,
} = require("../services/geocodingService");
const {
  updatePropertyLocation,
} = require("../services/propertyLocationService");

// Pause between requests to stay well under
// Google's rate limits.
const DELAY_MS = 200;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!isGeocodingEnabled()) {
    console.error(
      "GOOGLE_MAPS_SERVER_KEY is not set in backend/.env"
    );
    process.exitCode = 1;
    return;
  }

  const result = await pool.query(
    `SELECT id, title, address, city, state, zip_code
     FROM properties
     WHERE latitude IS NULL
     ORDER BY id`
  );

  console.log(
    `Found ${result.rows.length} properties without coordinates.`
  );

  let updated = 0;

  for (const property of result.rows) {
    const coordinates =
      await updatePropertyLocation(property);

    if (coordinates) {
      updated += 1;
      console.log(
        `#${property.id} ${property.title}: ` +
          `${coordinates.latitude}, ${coordinates.longitude}`
      );
    } else {
      console.log(
        `#${property.id} ${property.title}: not found`
      );
    }

    await sleep(DELAY_MS);
  }

  console.log(
    `Done. Updated ${updated} of ${result.rows.length}.`
  );
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
