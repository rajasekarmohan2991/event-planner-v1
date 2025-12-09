-- Registration settings per event
CREATE TABLE IF NOT EXISTS event_registration_settings (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  deadline_at TIMESTAMP WITH TIME ZONE NULL,
  capacity INTEGER NULL,
  waitlist_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  require_rsvp BOOLEAN NOT NULL DEFAULT TRUE,
  confirmation_template_id BIGINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registration_custom_fields (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  field_key VARCHAR(64) NOT NULL,
  label VARCHAR(255) NOT NULL,
  field_type VARCHAR(24) NOT NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  options JSONB NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  visibility VARCHAR(24) NOT NULL DEFAULT 'PUBLIC',
  logic JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reg_field_event_key ON registration_custom_fields(event_id, field_key);
