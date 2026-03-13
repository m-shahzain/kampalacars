-- Car Marketplace Database Schema (Supabase/PostgreSQL)
-- Complete schema with NO RLS - using custom cookie-based auth

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (if re-running)
-- ============================================
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS car_brands CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- TABLES
-- ============================================

-- Users table (handles sellers, buyers, and admins)
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
    features TEXT,
    is_sold BOOLEAN DEFAULT FALSE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_cars_seller ON cars(seller_id);
CREATE INDEX idx_cars_brand ON cars(brand_id);
CREATE INDEX idx_cars_price ON cars(price);
CREATE INDEX idx_cars_year ON cars(year);
CREATE INDEX idx_cars_sold ON cars(is_sold);
CREATE INDEX idx_cars_created ON cars(created_at DESC);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_brands_name ON car_brands(brand_name);

-- ============================================
-- DISABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE car_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE cars DISABLE ROW LEVEL SECURITY;

-- ============================================
-- GRANT PUBLIC ACCESS (for supabase anon key)
-- ============================================
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON car_brands TO anon, authenticated;
GRANT ALL ON cars TO anon, authenticated;
