-- Locations and Event Planning tables

CREATE TABLE IF NOT EXISTS locations (
    id BIGSERIAL PRIMARY KEY,
    place_id VARCHAR(128) UNIQUE,
    name VARCHAR(200) NOT NULL,
    display_name TEXT,
    address VARCHAR(300),
    city VARCHAR(120),
    state VARCHAR(120),
    country VARCHAR(120),
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    timezone VARCHAR(64),
    venue_type VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country);

CREATE TABLE IF NOT EXISTS event_planning (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
    location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
    budget_inr NUMERIC(14,2),
    expected_attendees INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_planning_event ON event_planning(event_id);
CREATE INDEX IF NOT EXISTS idx_event_planning_location ON event_planning(location_id);
