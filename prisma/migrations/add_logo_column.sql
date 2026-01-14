-- Add logo column to tenants table
-- This allows companies to upload and store their organization logo

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo TEXT;

-- Add index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_tenants_logo ON tenants(logo) WHERE logo IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN tenants.logo IS 'URL to company logo image (stored in Vercel Blob or as data URL)';
