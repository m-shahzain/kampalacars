-- Supabase Auth, part 1 of 2. Run in the Supabase SQL editor BEFORE
-- scripts/migrate-users-to-supabase-auth.mjs and before deploying the new code.
-- Safe to run more than once.

-- Passwords now live (hashed) in Supabase Auth, not in this table.
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Create the profile row whenever a login account is created (email sign-up,
-- Google sign-in, or the migration script). Only buyer/seller can be chosen;
-- admin can never be requested through sign-up data.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  requested_type text := meta->>'user_type';
BEGIN
  INSERT INTO public.users (user_id, email, fullname, phone, address, profile_picture_url, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    LEFT(COALESCE(
      NULLIF(TRIM(meta->>'fullname'), ''),
      NULLIF(TRIM(meta->>'full_name'), ''),
      NULLIF(TRIM(meta->>'name'), ''),
      split_part(NEW.email, '@', 1)
    ), 50),
    LEFT(NULLIF(TRIM(meta->>'phone'), ''), 20),
    NULLIF(TRIM(meta->>'address'), ''),
    COALESCE(NULLIF(meta->>'avatar_url', ''), NULLIF(meta->>'picture', '')),
    CASE WHEN requested_type IN ('buyer', 'seller') THEN requested_type ELSE 'buyer' END
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
