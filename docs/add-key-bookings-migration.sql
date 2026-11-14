-- Car key service bookings. Run this once in the Supabase SQL editor.
-- Anyone can book (visitors too); only admins can read and update bookings.

CREATE TABLE IF NOT EXISTS key_bookings (
  booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 30),
  car_make TEXT NOT NULL CHECK (char_length(car_make) BETWEEN 1 AND 60),
  car_model TEXT NOT NULL CHECK (char_length(car_model) BETWEEN 1 AND 60),
  car_year INTEGER CHECK (car_year BETWEEN 1950 AND 2100),
  key_type TEXT NOT NULL
    CHECK (key_type IN ('standard', 'transponder', 'remote-head', 'flip', 'smart', 'not-sure')),
  service_type TEXT NOT NULL
    CHECK (service_type IN ('spare', 'lost', 'programming', 'shell', 'repair')),
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL CHECK (preferred_time IN ('morning', 'afternoon', 'evening')),
  service_location TEXT NOT NULL CHECK (service_location IN ('workshop', 'mobile')),
  area TEXT CHECK (char_length(area) <= 200),
  notes TEXT CHECK (char_length(notes) <= 1000),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_key_bookings_created_at ON key_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_key_bookings_status ON key_bookings(status);

ALTER TABLE key_bookings ENABLE ROW LEVEL SECURITY;

-- True when the signed-in user is an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND user_type = 'admin')
$$;

-- New bookings only: a visitor cannot set the status or book in someone else's name.
DROP POLICY IF EXISTS "Anyone can book a key service" ON key_bookings;
CREATE POLICY "Anyone can book a key service" ON key_bookings
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'new' AND (user_id IS NULL OR user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins read key bookings" ON key_bookings;
CREATE POLICY "Admins read key bookings" ON key_bookings
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update key bookings" ON key_bookings;
CREATE POLICY "Admins update key bookings" ON key_bookings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON key_bookings FROM anon, authenticated;
GRANT INSERT ON key_bookings TO anon, authenticated;
GRANT SELECT ON key_bookings TO authenticated;
GRANT UPDATE (status) ON key_bookings TO authenticated;
