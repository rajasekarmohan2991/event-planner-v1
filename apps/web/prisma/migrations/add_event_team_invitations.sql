-- Create event_team_invitations table for storing team member invitations
-- This table tracks pending invitations before users accept/reject them

CREATE TABLE IF NOT EXISTS event_team_invitations (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STAFF',
    token VARCHAR(255) NOT NULL,
    invited_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Unique constraint to prevent duplicate invitations for same email+event
    CONSTRAINT event_team_invitations_email_event_unique UNIQUE (event_id, email)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_team_invitations_event_id ON event_team_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_team_invitations_email ON event_team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_event_team_invitations_token ON event_team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_event_team_invitations_status ON event_team_invitations(status);

-- Add comment for documentation
COMMENT ON TABLE event_team_invitations IS 'Stores pending team member invitations for events. Users must accept invitations before becoming full team members.';
