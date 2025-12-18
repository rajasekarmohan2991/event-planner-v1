-- Performance Optimization: Add Strategic Indexes
-- This migration adds indexes to frequently queried columns for faster lookups

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_status_starts ON events(status, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_tenant_status ON events(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_name_search ON events USING gin(to_tsvector('english', name));

-- Registrations table indexes
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON registrations(event_id, status);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_checkin ON registrations(check_in_status, event_id);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(current_tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

-- Payments table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_payments_registration ON payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_event ON payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- RSVP table indexes
CREATE INDEX IF NOT EXISTS idx_rsvp_event_status ON rsvp(event_id, status);
CREATE INDEX IF NOT EXISTS idx_rsvp_user ON rsvp(user_id);

-- Seat Inventory indexes
CREATE INDEX IF NOT EXISTS idx_seat_inventory_event_status ON seat_inventory(event_id, status);
CREATE INDEX IF NOT EXISTS idx_seat_inventory_section ON seat_inventory(event_id, section);

-- Seat Reservations indexes
CREATE INDEX IF NOT EXISTS idx_seat_reservations_user ON seat_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_expires ON seat_reservations(expires_at) WHERE status = 'RESERVED';

-- Module Access Matrix indexes
CREATE INDEX IF NOT EXISTS idx_module_access_role ON module_access_matrix(role);

-- Tenant Members indexes
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_role ON tenant_members(tenant_id, role);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);

-- Promo Codes indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_event_active ON promo_codes(event_id, is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_dates ON promo_codes(start_date, end_date) WHERE is_active = true;

-- Exhibitors indexes
CREATE INDEX IF NOT EXISTS idx_exhibitors_event ON exhibitors(event_id);

-- Speakers indexes  
CREATE INDEX IF NOT EXISTS idx_speakers_event ON speakers(event_id);

-- Analyze tables to update statistics
ANALYZE events;
ANALYZE registrations;
ANALYZE users;
ANALYZE payments;
ANALYZE rsvp;
ANALYZE seat_inventory;
ANALYZE seat_reservations;

-- Vacuum to reclaim space and update statistics
VACUUM ANALYZE;
