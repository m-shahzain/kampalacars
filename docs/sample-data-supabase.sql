-- Sample data for Car Marketplace (Supabase/PostgreSQL)
-- Run this AFTER database-supabase.sql

-- Insert sample car brands
INSERT INTO car_brands (brand_id, brand_name) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Toyota'),
('550e8400-e29b-41d4-a716-446655440002', 'Honda'),
('550e8400-e29b-41d4-a716-446655440003', 'Ford'),
('550e8400-e29b-41d4-a716-446655440004', 'BMW'),
('550e8400-e29b-41d4-a716-446655440005', 'Mercedes-Benz'),
('550e8400-e29b-41d4-a716-446655440006', 'Audi'),
('550e8400-e29b-41d4-a716-446655440007', 'Volkswagen'),
('550e8400-e29b-41d4-a716-446655440008', 'Nissan'),
('550e8400-e29b-41d4-a716-446655440009', 'Hyundai'),
('550e8400-e29b-41d4-a716-446655440010', 'Kia'),
('550e8400-e29b-41d4-a716-446655440011', 'Mazda'),
('550e8400-e29b-41d4-a716-446655440012', 'Subaru'),
('550e8400-e29b-41d4-a716-446655440013', 'Chevrolet'),
('550e8400-e29b-41d4-a716-446655440014', 'Lexus'),
('550e8400-e29b-41d4-a716-446655440015', 'Infiniti')
ON CONFLICT (brand_id) DO NOTHING;

-- Insert sample users (plain text passwords as requested)
INSERT INTO users (user_id, fullname, email, password, phone, user_type) VALUES
('550e8400-e29b-41d4-a716-446655440101', 'John Doe', 'john@example.com', 'password123', '+256701234567', 'seller'),
('550e8400-e29b-41d4-a716-446655440102', 'Jane Smith', 'jane@example.com', 'password123', '+256701234568', 'seller'),
('550e8400-e29b-41d4-a716-446655440103', 'Bob Wilson', 'bob@example.com', 'password123', '+256701234569', 'seller'),
('550e8400-e29b-41d4-a716-446655440104', 'Alice Johnson', 'alice@example.com', 'password123', '+256701234570', 'seller'),
('550e8400-e29b-41d4-a716-446655440105', 'David Brown', 'david@example.com', 'password123', '+256701234571', 'buyer'),
('550e8400-e29b-41d4-a716-446655440106', 'Sarah Davis', 'sarah@example.com', 'password123', '+256701234572', 'buyer'),
('550e8400-e29b-41d4-a716-446655440107', 'Mike Taylor', 'mike@example.com', 'password123', '+256701234573', 'admin'),
('550e8400-e29b-41d4-a716-446655440108', 'Lisa Garcia', 'lisa@example.com', 'password123', '+256701234574', 'seller'),
('550e8400-e29b-41d4-a716-446655440109', 'Tom Anderson', 'tom@example.com', 'password123', '+256701234575', 'seller'),
('550e8400-e29b-41d4-a716-446655440110', 'Emma White', 'emma@example.com', 'password123', '+256701234576', 'buyer')
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample cars
INSERT INTO cars (car_id, seller_id, brand_id, model, title, description, body_type, fuel_type, year, price, currency, mileage, color, engine_size, transmission, features, image_urls) VALUES
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'Camry XLE', '2022 Toyota Camry XLE - Excellent Condition', 'Beautiful 2022 Toyota Camry XLE with premium features. Well maintained, single owner, perfect for daily commuting.', 'sedan', 'gasoline', 2022, 28500.00, 'USD', 15000, 'Silver', '2.5L', 'automatic', 'Leather seats, Sunroof, Navigation, Backup camera, Heated seats', ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800']),

('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440002', 'Accord Sport', '2021 Honda Accord Sport - Like New', 'Sporty 2021 Honda Accord with low mileage. Perfect for those who want performance and reliability combined.', 'sedan', 'gasoline', 2021, 26800.00, 'USD', 12000, 'Red', '1.5L Turbo', 'manual', 'Sport suspension, Alloy wheels, Apple CarPlay, Android Auto', ARRAY['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800']),

('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440003', 'F-150 XLT', '2020 Ford F-150 XLT Crew Cab', 'Powerful and reliable 2020 Ford F-150 XLT. Perfect for work and family adventures.', 'pickup', 'gasoline', 2020, 32000.00, 'USD', 45000, 'Blue', '3.5L V6', 'automatic', 'Crew cab, Bed liner, Towing package, 4WD', ARRAY['https://images.unsplash.com/photo-1494976536318-2fd26e64fe26?w=800']),

('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440004', 'X3 xDrive30i', '2023 BMW X3 xDrive30i - Luxury SUV', 'Premium 2023 BMW X3 with all-wheel drive. Ultimate luxury and performance in one package.', 'suv', 'gasoline', 2023, 42000.00, 'USD', 8000, 'Black', '2.0L Turbo', 'automatic', 'All-wheel drive, Premium package, Panoramic sunroof, Harman Kardon sound', ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800']),

('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440005', 'C300 4MATIC', '2022 Mercedes-Benz C300 4MATIC', 'Elegant 2022 Mercedes-Benz C300 with all-wheel drive. German engineering at its finest.', 'sedan', 'gasoline', 2022, 38500.00, 'USD', 18000, 'White', '2.0L Turbo', 'automatic', 'All-wheel drive, AMG Line, MBUX infotainment, Premium package', ARRAY['https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800']),

('550e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440006', 'A4 Quattro', '2021 Audi A4 Quattro Premium Plus', 'Sophisticated 2021 Audi A4 with Quattro all-wheel drive. Perfect balance of luxury and performance.', 'sedan', 'gasoline', 2021, 35000.00, 'USD', 22000, 'Gray', '2.0L Turbo', 'automatic', 'Quattro AWD, Virtual cockpit, Premium plus package, B&O sound', ARRAY['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800']),

('550e8400-e29b-41d4-a716-446655440207', '550e8400-e29b-41d4-a716-446655440108', '550e8400-e29b-41d4-a716-446655440007', 'Golf GTI', '2020 Volkswagen Golf GTI - Hot Hatch', 'Fun and sporty 2020 VW Golf GTI. Perfect for enthusiasts who want performance and practicality.', 'hatchback', 'gasoline', 2020, 24500.00, 'USD', 28000, 'Red', '2.0L Turbo', 'manual', 'Performance package, Plaid seats, Touchscreen infotainment', ARRAY['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800']),

('550e8400-e29b-41d4-a716-446655440208', '550e8400-e29b-41d4-a716-446655440109', '550e8400-e29b-41d4-a716-446655440008', 'Altima SR', '2021 Nissan Altima SR - Sporty Sedan', 'Dynamic 2021 Nissan Altima SR with sporty styling and efficient engine.', 'sedan', 'gasoline', 2021, 23000.00, 'USD', 20000, 'Orange', '2.5L', 'cvt', 'SR trim, Sport suspension, 19-inch wheels, Bose audio', ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800']),

('550e8400-e29b-41d4-a716-446655440209', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440009', 'Tucson Limited', '2022 Hyundai Tucson Limited - Compact SUV', 'Modern 2022 Hyundai Tucson Limited with hybrid technology and premium features.', 'suv', 'hybrid', 2022, 31000.00, 'USD', 15000, 'Blue', '1.6L Turbo Hybrid', 'automatic', 'Hybrid system, Limited trim, Panoramic sunroof, Wireless charging', ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800']),

('550e8400-e29b-41d4-a716-446655440210', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440010', 'Stinger GT', '2021 Kia Stinger GT - Performance Sedan', 'Powerful 2021 Kia Stinger GT with twin-turbo V6 engine. Pure driving excitement.', 'sedan', 'gasoline', 2021, 34000.00, 'USD', 25000, 'Gray', '3.3L Twin Turbo V6', 'automatic', 'GT trim, Twin turbo, Brembo brakes, Premium audio', ARRAY['https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800']),

('550e8400-e29b-41d4-a716-446655440211', '550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440011', 'CX-5 Grand Touring', '2022 Mazda CX-5 Grand Touring AWD', 'Refined 2022 Mazda CX-5 with all-wheel drive and premium interior.', 'suv', 'gasoline', 2022, 29000.00, 'USD', 18000, 'Red', '2.5L', 'automatic', 'All-wheel drive, Grand Touring trim, Bose audio, Leather seats', ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800']),

('550e8400-e29b-41d4-a716-446655440212', '550e8400-e29b-41d4-a716-446655440108', '550e8400-e29b-41d4-a716-446655440012', 'Outback Limited', '2021 Subaru Outback Limited', 'Adventure-ready 2021 Subaru Outback Limited with standard all-wheel drive.', 'wagon', 'gasoline', 2021, 27500.00, 'USD', 30000, 'Green', '2.5L', 'cvt', 'All-wheel drive, Limited trim, Roof rails, EyeSight safety', ARRAY['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800']),

('550e8400-e29b-41d4-a716-446655440213', '550e8400-e29b-41d4-a716-446655440109', '550e8400-e29b-41d4-a716-446655440013', 'Malibu LT', '2020 Chevrolet Malibu LT - Midsize Sedan', 'Comfortable 2020 Chevrolet Malibu LT with efficient engine and spacious interior.', 'sedan', 'gasoline', 2020, 19500.00, 'USD', 35000, 'White', '1.5L Turbo', 'automatic', 'LT trim, Touchscreen, Apple CarPlay, OnStar', ARRAY['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800']),

('550e8400-e29b-41d4-a716-446655440214', '550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440014', 'ES 350', '2022 Lexus ES 350 - Luxury Sedan', 'Luxurious 2022 Lexus ES 350 with premium comfort and advanced safety features.', 'sedan', 'gasoline', 2022, 41000.00, 'USD', 12000, 'Pearl White', '3.5L V6', 'automatic', 'Luxury package, Mark Levinson audio, Safety System 2.0', ARRAY['https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800']),

('550e8400-e29b-41d4-a716-446655440215', '550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440015', 'QX50 Essential', '2021 Infiniti QX50 Essential AWD', 'Innovative 2021 Infiniti QX50 with variable compression turbo engine.', 'suv', 'gasoline', 2021, 33500.00, 'USD', 22000, 'Black', '2.0L VC-Turbo', 'cvt', 'All-wheel drive, VC-Turbo engine, ProPILOT Assist, Bose audio', ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800'])
ON CONFLICT (car_id) DO NOTHING;
