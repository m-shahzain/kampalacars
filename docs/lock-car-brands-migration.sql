-- Car brands: anyone may read them, only the server (service role, used by the
-- admin brands page at /admin/brands) may add, rename or delete them.
-- Before this, car_brands had RLS off and GRANT ALL to anon, so anyone holding the
-- public key could change brands directly.

ALTER TABLE car_brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brands are readable" ON car_brands;
CREATE POLICY "Brands are readable" ON car_brands
  FOR SELECT USING (true);

REVOKE INSERT, UPDATE, DELETE ON car_brands FROM anon, authenticated;
GRANT SELECT ON car_brands TO anon, authenticated;
