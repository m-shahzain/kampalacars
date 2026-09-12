-- Run this once in the Supabase SQL editor for an existing database.
ALTER TABLE cars
  ALTER COLUMN currency SET DEFAULT 'UGX';

-- This changes the currency code only. It does not convert stored price values.
UPDATE cars
SET currency = 'UGX'
WHERE currency IS DISTINCT FROM 'UGX';
