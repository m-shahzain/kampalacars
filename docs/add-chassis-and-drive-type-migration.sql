-- Run this once in the Supabase SQL editor for an existing database.
-- Existing listings can leave these fields blank; new listings require both.
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS chassis_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS drive_type TEXT CHECK (drive_type IN ('2wd', '4wd'));

-- Prevent duplicates even when letters are entered in a different case.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cars_chassis_number_unique
  ON cars (UPPER(chassis_number))
  WHERE chassis_number IS NOT NULL;
