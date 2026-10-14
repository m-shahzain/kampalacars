-- Run this migration in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS car_likes (
  car_id UUID NOT NULL REFERENCES cars(car_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (car_id, user_id)
);

CREATE TABLE IF NOT EXISTS car_views (
  view_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id UUID NOT NULL REFERENCES cars(car_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_car_likes_car_id ON car_likes(car_id);
CREATE INDEX IF NOT EXISTS idx_car_views_car_id ON car_views(car_id);

-- This project authorizes requests in its Next.js API routes.
ALTER TABLE car_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE car_views DISABLE ROW LEVEL SECURITY;
GRANT ALL ON car_likes TO anon, authenticated;
GRANT ALL ON car_views TO anon, authenticated;
