-- Add property schedule and contact information
-- to the existing Insane Stays database.

BEGIN;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS contact_info TEXT,
  ADD COLUMN IF NOT EXISTS available_from DATE,
  ADD COLUMN IF NOT EXISTS available_to DATE,
  ADD COLUMN IF NOT EXISTS check_in_time TIME,
  ADD COLUMN IF NOT EXISTS check_out_time TIME;

-- Set default times for existing properties.
UPDATE properties
SET check_in_time = '15:00'
WHERE check_in_time IS NULL;

UPDATE properties
SET check_out_time = '11:00'
WHERE check_out_time IS NULL;

ALTER TABLE properties
  ALTER COLUMN check_in_time SET DEFAULT '15:00';

ALTER TABLE properties
  ALTER COLUMN check_out_time SET DEFAULT '11:00';

-- Availability dates must either both be null
-- or form a valid date range.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'properties_availability_range_check'
      AND conrelid = 'properties'::regclass
  ) THEN
    ALTER TABLE properties
      ADD CONSTRAINT properties_availability_range_check
      CHECK (
        (
          available_from IS NULL
          AND available_to IS NULL
        )
        OR (
          available_from IS NOT NULL
          AND available_to IS NOT NULL
          AND available_to > available_from
        )
      );
  END IF;
END $$;

COMMIT;
