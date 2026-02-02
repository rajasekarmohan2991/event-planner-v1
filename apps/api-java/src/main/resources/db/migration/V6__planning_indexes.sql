-- Additional indexes to improve query performance at scale

-- Speakers
CREATE INDEX IF NOT EXISTS idx_speakers_name ON speakers (name);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_track ON sessions (track);
CREATE INDEX IF NOT EXISTS idx_sessions_room ON sessions (room);

-- Sponsors
CREATE INDEX IF NOT EXISTS idx_sponsors_name ON sponsors (name);
CREATE INDEX IF NOT EXISTS idx_sponsors_tier ON sponsors (tier);
