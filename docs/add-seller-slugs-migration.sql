-- Short, shareable seller page addresses, e.g. kampalacars.com/sellers/ali-bhai-delta-cruise-motors
-- Run once in the Supabase SQL editor before deploying the seller pages. Safe to re-run.

ALTER TABLE users ADD COLUMN IF NOT EXISTS slug TEXT;

-- "Ali Bhai \"Delta Cruise Motors\"" -> "ali-bhai-delta-cruise-motors"
CREATE OR REPLACE FUNCTION public.slugify(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(TRIM(BOTH '-' FROM regexp_replace(lower(COALESCE(value, '')), '[^a-z0-9]+', '-', 'g')), '')
$$;

-- Adds -2, -3, ... when two sellers have the same name.
CREATE OR REPLACE FUNCTION public.unique_user_slug(base text, uid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  root text := LEFT(COALESCE(base, 'seller'), 60);
  candidate text := root;
  n int := 1;
BEGIN
  WHILE EXISTS (SELECT 1 FROM users WHERE slug = candidate AND user_id <> uid) LOOP
    n := n + 1;
    candidate := root || '-' || n;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Give existing users a slug, oldest accounts first so they keep the plain name.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT user_id, fullname FROM users WHERE slug IS NULL ORDER BY created_at LOOP
    UPDATE users SET slug = public.unique_user_slug(public.slugify(r.fullname), r.user_id) WHERE user_id = r.user_id;
  END LOOP;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS users_slug_key ON users(slug);

-- New accounts get a slug automatically. It never changes afterwards, so shared links keep working.
CREATE OR REPLACE FUNCTION public.set_user_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := public.unique_user_slug(public.slugify(NEW.fullname), NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_slug ON users;
CREATE TRIGGER users_set_slug
  BEFORE INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION public.set_user_slug();
