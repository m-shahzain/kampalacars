-- Run this once in the Supabase SQL editor for an existing database.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS address TEXT;
