-- Records when each listing last changed (price edits, marked as sold, ...).
-- The sitemap uses it so Google re-visits changed cars, and sold cars leave the
-- search index 60 days after being marked sold.
-- Run once in the Supabase SQL editor. Safe to re-run.

ALTER TABLE cars ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Existing listings start from their approval (or creation) date.
UPDATE cars SET updated_at = COALESCE(approved_at, created_at) WHERE updated_at IS NULL;

ALTER TABLE cars ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE cars ALTER COLUMN updated_at SET NOT NULL;

CREATE OR REPLACE FUNCTION public.set_car_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cars_set_updated_at ON cars;
CREATE TRIGGER cars_set_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION public.set_car_updated_at();
