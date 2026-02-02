-- Create event team members table
CREATE TABLE IF NOT EXISTS event_team_members (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(320) NOT NULL,
  role VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  invited_at TIMESTAMPTZ NULL,
  joined_at TIMESTAMPTZ NULL,
  progress INTEGER NULL
);

CREATE INDEX IF NOT EXISTS idx_event_member_event ON event_team_members(event_id);
CREATE INDEX IF NOT EXISTS idx_event_member_email ON event_team_members(email);
