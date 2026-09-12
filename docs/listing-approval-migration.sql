-- Run this once in the Supabase SQL editor for an existing database.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(user_id);

CREATE INDEX IF NOT EXISTS idx_cars_approval_status ON cars(approval_status);

-- Existing listings remain visible after the feature is introduced.
UPDATE cars
SET approval_status = 'approved', approved_at = COALESCE(approved_at, NOW())
WHERE approval_status = 'pending';
