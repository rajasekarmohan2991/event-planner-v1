-- Performance Optimization: Database Indexes
-- Run this SQL on your production database to speed up queries

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);

-- Registrations table indexes
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(data_json->>'email');
CREATE INDEX IF NOT EXISTS idx_registrations_phone ON registrations(data_json->>'phone');
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);

-- Floor plans table indexes
CREATE INDEX IF NOT EXISTS idx_floor_plans_event_id ON floor_plans(event_id);
CREATE INDEX IF NOT EXISTS idx_floor_plans_tenant_id ON floor_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_floor_plans_status ON floor_plans(status);

-- Speakers table indexes
CREATE INDEX IF NOT EXISTS idx_speakers_event_id ON speakers(event_id);
CREATE INDEX IF NOT EXISTS idx_speakers_tenant_id ON speakers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_speakers_created_at ON speakers(created_at DESC);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant_id ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);

-- Session speakers junction table indexes
CREATE INDEX IF NOT EXISTS idx_session_speakers_session_id ON session_speakers(session_id);
CREATE INDEX IF NOT EXISTS idx_session_speakers_speaker_id ON session_speakers(speaker_id);

-- Sponsors table indexes
CREATE INDEX IF NOT EXISTS idx_sponsors_event_id ON sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_tenant_id ON sponsors(tenant_id);

-- Vendors table indexes  
CREATE INDEX IF NOT EXISTS idx_vendors_event_id ON vendors(event_id);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id ON vendors(tenant_id);

-- Team members table indexes
CREATE INDEX IF NOT EXISTS idx_team_members_event_id ON team_members(event_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Exhibitors table indexes
CREATE INDEX IF NOT EXISTS idx_exhibitors_event_id ON exhibitors(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitors_status ON exhibitors(status);

-- Promo codes table indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_event_id ON promo_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Tenants table indexes
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);

-- Analyze tables for query optimization
ANALYZE events;
ANALYZE registrations;
ANALYZE floor_plans;
ANALYZE speakers;
ANALYZE sessions;
ANALYZE session_speakers;
ANALYZE sponsors;
ANALYZE vendors;
ANALYZE team_members;
ANALYZE exhibitors;
ANALYZE promo_codes;
ANALYZE users;
ANALYZE tenants;

-- Vacuum to reclaim storage and update statistics
VACUUM ANALYZE;
