-- Add gender column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(16);

-- Backfill existing rows to OTHER (so API responses have a value)
UPDATE users SET gender = 'OTHER' WHERE gender IS NULL;
