-- Supabase Auth, part 2 of 2. Run in the Supabase SQL editor AFTER the new
-- code is live and scripts/migrate-users-to-supabase-auth.mjs reported no failures.

-- 1. This must return no rows. If it lists anyone, re-run the migration
--    script before continuing.
SELECT user_id, email
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.id = u.user_id);

-- 2. Remove the plain-text passwords.
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- 3. Each profile belongs to a login account; deleting the account deletes the profile.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_user_fkey;
ALTER TABLE users
  ADD CONSTRAINT users_auth_user_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Stop anyone from editing other people's profiles or making themselves
--    admin/premium through the public API key. Profiles stay readable because
--    listings show the seller's name and picture.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are readable" ON users;
CREATE POLICY "Profiles are readable" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update their own profile" ON users;
CREATE POLICY "Users update their own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON users FROM anon, authenticated;
GRANT UPDATE (fullname, phone, address, profile_picture_url) ON users TO authenticated;
