-- EPIC 1: Event Microsite (theme + sections)

CREATE TYPE microsite_section_type AS ENUM ('HERO','ABOUT','SCHEDULE','SPEAKERS','SPONSORS','FAQ','CUSTOM');

CREATE TABLE IF NOT EXISTS microsite_themes (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    primary_color TEXT,
    secondary_color TEXT,
    background_color TEXT,
    text_color TEXT,
    font_family TEXT,
    hero_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS idx_microsite_themes_event ON microsite_themes(event_id);

CREATE TABLE IF NOT EXISTS microsite_sections (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    type microsite_section_type NOT NULL,
    title TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    content TEXT, -- JSON string payload (schema-free)
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_microsite_sections_event ON microsite_sections(event_id);
CREATE INDEX IF NOT EXISTS idx_microsite_sections_position ON microsite_sections(event_id, position);
