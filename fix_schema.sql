-- Fix Schema Issues
-- 1. Add missing tenant_id columns to tables
-- 2. Create missing activity_log table
-- 3. Fix data type issues

-- Add tenant_id to event_team_members if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'event_team_members' AND column_name = 'tenant_id') THEN
    ALTER TABLE event_team_members ADD COLUMN tenant_id VARCHAR(255);
    -- Populate tenant_id from events table
    UPDATE event_team_members etm
    SET tenant_id = e.tenant_id
    FROM events e
    WHERE etm.event_id = e.id;
  END IF;
END $$;

-- Add tenant_id to speakers if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'speakers' AND column_name = 'tenant_id') THEN
    ALTER TABLE speakers ADD COLUMN tenant_id VARCHAR(255);
    -- Populate tenant_id from events table
    UPDATE speakers s
    SET tenant_id = e.tenant_id
    FROM events e
    WHERE s.event_id = e.id;
  END IF;
END $$;

-- Add tenant_id to sessions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sessions' AND column_name = 'tenant_id') THEN
    ALTER TABLE sessions ADD COLUMN tenant_id VARCHAR(255);
    -- Populate tenant_id from events table
    UPDATE sessions s
    SET tenant_id = e.tenant_id
    FROM events e
    WHERE s.event_id = e.id;
  END IF;
END $$;

-- Add tenant_id to sponsors if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sponsors' AND column_name = 'tenant_id') THEN
    ALTER TABLE sponsors ADD COLUMN tenant_id VARCHAR(255);
    -- Populate tenant_id from events table
    UPDATE sponsors sp
    SET tenant_id = e.tenant_id
    FROM events e
    WHERE sp.event_id = e.id;
  END IF;
END $$;

-- Create activity_log table if not exists
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  action_type VARCHAR(100) NOT NULL,
  action_description TEXT,
  entity_type VARCHAR(100),
  entity_id BIGINT,
  entity_name VARCHAR(255),
  metadata JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create index on activity_log for performance
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Ensure data_json in registrations is JSONB (not TEXT)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'registrations' 
    AND column_name = 'data_json' 
    AND data_type = 'text'
  ) THEN
    -- Convert TEXT to JSONB
    ALTER TABLE registrations ALTER COLUMN data_json TYPE JSONB USING data_json::jsonb;
  END IF;
END $$;

-- Grant permissions
GRANT ALL PRIVILEGES ON activity_log TO postgres;
GRANT USAGE, SELECT ON SEQUENCE activity_log_id_seq TO postgres;

-- Success message
SELECT 'Schema migration completed successfully!' as status;
