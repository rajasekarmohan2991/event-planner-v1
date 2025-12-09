-- Add event_mode column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS event_mode VARCHAR(20) NOT NULL DEFAULT 'IN_PERSON';
