ALTER TABLE "events" 
ADD COLUMN IF NOT EXISTS "terms_and_conditions" TEXT,
ADD COLUMN IF NOT EXISTS "disclaimer" TEXT,
ADD COLUMN IF NOT EXISTS "event_manager_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "event_manager_contact" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "event_manager_email" VARCHAR(255);
