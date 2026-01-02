-- Event Team Invitations Table
-- Run this SQL in your database (Neon, Supabase, etc.)

CREATE TABLE IF NOT EXISTS event_team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL, -- OWNER, ORGANIZER, STAFF, VIEWER
  status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, EXPIRED
  invited_by TEXT, -- User ID who sent the invitation
  token TEXT UNIQUE NOT NULL, -- Secure token for approve/reject links
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(event_id, email)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON event_team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON event_team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_event ON event_team_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON event_team_invitations(status);
