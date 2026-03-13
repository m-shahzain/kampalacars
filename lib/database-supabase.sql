-- Car Marketplace Database Schema (Supabase/PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (handles both sellers and buyers)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fullname VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type TEXT CHECK (user_type IN ('seller', 'buyer', 'admin')) DEFAULT 'buyer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Car brands table
CREATE TABLE car_brands (
    brand_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cars table (listings)
CREATE TABLE cars (
    car_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES car_brands(brand_id),
    model VARCHAR(200) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    body_type TEXT CHECK (body_type IN ('sedan', 'hatchback', 'suv', 'coupe', 'convertible', 'wagon', 'pickup', 'van', 'minivan')) NOT NULL,
    fuel_type TEXT CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid', 'cng', 'lpg')) NOT NULL,
    year INTEGER NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    mileage INTEGER,
    color VARCHAR(30),
    engine_size VARCHAR(20),
    transmission TEXT CHECK (transmission IN ('manual', 'automatic', 'cvt', 'semi-automatic')) NOT NULL,
    features TEXT, -- JSON or comma-separated string
    is_sold BOOLEAN DEFAULT FALSE,
    image_urls TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_cars_seller ON cars(seller_id);
CREATE INDEX idx_cars_brand ON cars(brand_id);
CREATE INDEX idx_cars_price ON cars(price);
CREATE INDEX idx_cars_year ON cars(year);
CREATE INDEX idx_cars_sold ON cars(is_sold);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_brands_name ON car_brands(brand_name);

-- Disable RLS (auth is handled by API routes, not Supabase Auth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE car_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE cars DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon and authenticated roles
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON car_brands TO anon, authenticated;
GRANT ALL ON cars TO anon, authenticated;

-- ============================================================
-- STORAGE: Create car-images bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'car-images',
  'car-images',
  true,
  5242880,  -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (required even with RLS disabled on tables)
CREATE POLICY "Car images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'car-images');

CREATE POLICY "Anyone can upload car images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'car-images');

CREATE POLICY "Anyone can update car images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'car-images');

CREATE POLICY "Anyone can delete car images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'car-images'); 