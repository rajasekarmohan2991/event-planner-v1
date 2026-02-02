-- Fix for AI-generated content: Change text fields to TEXT type
-- This migration changes description, termsAndConditions, disclaimer, and bio fields to TEXT type
-- to support longer AI-generated content

-- Event table
ALTER TABLE "events" ALTER COLUMN "description" TYPE TEXT;
ALTER TABLE "events" ALTER COLUMN "terms_and_conditions" TYPE TEXT;
ALTER TABLE "events" ALTER COLUMN "disclaimer" TYPE TEXT;

-- Speaker table  
ALTER TABLE "speakers" ALTER COLUMN "bio" TYPE TEXT;
