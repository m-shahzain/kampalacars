-- Run this migration in the Supabase SQL editor after add-car-likes-and-views-migration.sql.
-- Lets visitors like cars without logging in. Anonymous likes are keyed by a
-- random visitor_id cookie; logged-in likes keep using user_id.

ALTER TABLE car_likes ADD COLUMN IF NOT EXISTS visitor_id UUID;
ALTER TABLE car_likes ADD COLUMN IF NOT EXISTS like_id UUID NOT NULL DEFAULT uuid_generate_v4();

ALTER TABLE car_likes DROP CONSTRAINT IF EXISTS car_likes_pkey;
ALTER TABLE car_likes ADD PRIMARY KEY (like_id);
ALTER TABLE car_likes ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE car_likes DROP CONSTRAINT IF EXISTS car_likes_liker_check;
ALTER TABLE car_likes ADD CONSTRAINT car_likes_liker_check
  CHECK ((user_id IS NULL) <> (visitor_id IS NULL));

-- One like per car for each user, and one per car for each anonymous visitor.
CREATE UNIQUE INDEX IF NOT EXISTS car_likes_car_user_key
  ON car_likes(car_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS car_likes_car_visitor_key
  ON car_likes(car_id, visitor_id) WHERE visitor_id IS NOT NULL;
