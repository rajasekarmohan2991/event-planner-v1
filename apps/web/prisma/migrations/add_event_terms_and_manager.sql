-- Add terms, conditions, disclaimer, and event manager details to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS disclaimer TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_manager_name VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_manager_contact VARCHAR(50);
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_manager_email VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_manager_name ON events(event_manager_name);
