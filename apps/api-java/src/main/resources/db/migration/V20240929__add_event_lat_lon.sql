-- Add latitude and longitude columns to events table (idempotent for Postgres)
ALTER TABLE IF EXISTS events
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Optional: composite index to speed up geo-based queries (rough)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_events_lat_lon' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_events_lat_lon ON events (latitude, longitude);
  END IF;
END$$;
