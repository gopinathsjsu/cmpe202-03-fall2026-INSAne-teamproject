-- Add geocoded coordinates to properties
-- for Google Maps display and nearby search.

BEGIN;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Coordinates must either both be null
-- or both be within valid ranges.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'properties_coordinates_check'
      AND conrelid = 'properties'::regclass
  ) THEN
    ALTER TABLE properties
      ADD CONSTRAINT properties_coordinates_check
      CHECK (
        (
          latitude IS NULL
          AND longitude IS NULL
        )
        OR (
          latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND latitude BETWEEN -90 AND 90
          AND longitude BETWEEN -180 AND 180
        )
      );
  END IF;
END $$;

-- Speeds up the bounding-box prefilter
-- used by nearby search.
CREATE INDEX IF NOT EXISTS idx_properties_coordinates
  ON properties(latitude, longitude);

COMMIT;
