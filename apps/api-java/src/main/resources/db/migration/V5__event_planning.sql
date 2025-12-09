-- EPIC 1: Event Setup & Planning schema

CREATE TYPE sponsor_tier AS ENUM ('PLATINUM','GOLD','SILVER','BRONZE','PARTNER');

CREATE TABLE IF NOT EXISTS speakers (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT,
    bio TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_speakers_event ON speakers(event_id);

CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    room TEXT,
    track TEXT,
    capacity INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_event ON sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_times ON sessions(start_time, end_time);

CREATE TABLE IF NOT EXISTS session_speakers (
    session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    speaker_id BIGINT NOT NULL REFERENCES speakers(id) ON DELETE CASCADE,
    PRIMARY KEY (session_id, speaker_id)
);

CREATE TABLE IF NOT EXISTS sponsors (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    tier sponsor_tier NOT NULL,
    logo_url TEXT,
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_event ON sponsors(event_id);
