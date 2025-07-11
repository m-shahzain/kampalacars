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
    image_url TEXT NOT NULL,
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

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read all user profiles but only update their own
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Car brands are readable by everyone
CREATE POLICY "Car brands are viewable by everyone" ON car_brands FOR SELECT USING (true);

-- Cars policies
CREATE POLICY "Cars are viewable by everyone" ON cars FOR SELECT USING (true);
CREATE POLICY "Users can insert their own cars" ON cars FOR INSERT WITH CHECK (auth.uid()::text = seller_id::text);
CREATE POLICY "Users can update own cars" ON cars FOR UPDATE USING (auth.uid()::text = seller_id::text);
CREATE POLICY "Users can delete own cars" ON cars FOR DELETE USING (auth.uid()::text = seller_id::text); 