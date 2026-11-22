-- Body types become a table admins manage at /admin/body-types. Run this once in the
-- Supabase SQL editor.
--
-- cars.body_type keeps holding the same short code ("suv", "wagon"...), so existing
-- listings are untouched. The fixed CHECK list is replaced by a link to body_types, which
-- also stops a body type that cars still use from being deleted.

CREATE TABLE IF NOT EXISTS body_types (
  slug TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 40),
  name TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 40),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO body_types (slug, name) VALUES
  ('sedan', 'Sedan'),
  ('hatchback', 'Hatchback'),
  ('suv', 'SUV'),
  ('coupe', 'Coupe'),
  ('convertible', 'Convertible'),
  ('wagon', 'Station wagon'),
  ('pickup', 'Pickup'),
  ('van', 'Van'),
  ('minivan', 'Minivan')
ON CONFLICT (slug) DO NOTHING;

-- Any value already on a car must exist before the link can be added.
INSERT INTO body_types (slug, name)
SELECT DISTINCT body_type, initcap(replace(body_type, '-', ' '))
FROM cars
WHERE body_type IS NOT NULL AND body_type NOT IN (SELECT slug FROM body_types)
ON CONFLICT DO NOTHING;

-- Drop the old fixed list, whatever Postgres named it.
DO $$
DECLARE constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'cars' AND con.contype = 'c' AND pg_get_constraintdef(con.oid) ILIKE '%body_type%'
  LOOP
    EXECUTE format('ALTER TABLE cars DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_body_type_fkey;
ALTER TABLE cars ADD CONSTRAINT cars_body_type_fkey
  FOREIGN KEY (body_type) REFERENCES body_types(slug) ON DELETE RESTRICT;

-- Everyone may read body types; only the server (service role) changes them.
ALTER TABLE body_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Body types are readable" ON body_types;
CREATE POLICY "Body types are readable" ON body_types FOR SELECT USING (true);
REVOKE INSERT, UPDATE, DELETE ON body_types FROM anon, authenticated;
GRANT SELECT ON body_types TO anon, authenticated;
