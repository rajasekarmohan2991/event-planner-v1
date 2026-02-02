-- Migration: Add missing columns to tenants table
-- Description: Adds currency, country, and other missing fields to tenants table

-- Add currency column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='currency') THEN
        ALTER TABLE tenants ADD COLUMN currency TEXT DEFAULT 'INR';
    END IF;
END $$;

-- Add country column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='country') THEN
        ALTER TABLE tenants ADD COLUMN country TEXT DEFAULT 'IN';
    END IF;
END $$;

-- Add timezone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='timezone') THEN
        ALTER TABLE tenants ADD COLUMN timezone TEXT DEFAULT 'Asia/Kolkata';
    END IF;
END $$;

-- Add logo_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='logo_url') THEN
        ALTER TABLE tenants ADD COLUMN logo_url TEXT;
    END IF;
END $$;

-- Add website column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='website') THEN
        ALTER TABLE tenants ADD COLUMN website TEXT;
    END IF;
END $$;

-- Add address columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='address') THEN
        ALTER TABLE tenants ADD COLUMN address TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='city') THEN
        ALTER TABLE tenants ADD COLUMN city TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='state') THEN
        ALTER TABLE tenants ADD COLUMN state TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='postal_code') THEN
        ALTER TABLE tenants ADD COLUMN postal_code TEXT;
    END IF;
END $$;

-- Add phone column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='tenants' AND column_name='phone') THEN
        ALTER TABLE tenants ADD COLUMN phone TEXT;
    END IF;
END $$;

-- Update existing tenants to have default currency if NULL
UPDATE tenants SET currency = 'INR' WHERE currency IS NULL;
UPDATE tenants SET country = 'IN' WHERE country IS NULL;
UPDATE tenants SET timezone = 'Asia/Kolkata' WHERE timezone IS NULL;

COMMENT ON COLUMN tenants.currency IS 'Default currency for the company (ISO 4217 code)';
COMMENT ON COLUMN tenants.country IS 'Country code (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN tenants.timezone IS 'Default timezone for the company';
