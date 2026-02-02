-- Migration: Add tenant_id columns to all major tables
-- Phase 1: Multi-tenant architecture implementation

-- Step 1: Add tenant_id columns (nullable initially for backward compatibility)

-- Core event-related tables
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE speakers ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE exhibitor_registrations ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Registration and approval tables
ALTER TABLE registration_approvals ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE registration_custom_fields ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE registration_settings ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE event_registration_settings ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- RSVP and interest tables
ALTER TABLE rsvp_interests ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE event_rsvps ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Event management tables
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE event_invites ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE event_planning ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE event_team_members ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE event_ticket_settings ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Promo and payment tables
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE payment_settings ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Venue and location tables
ALTER TABLE locations ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE floor_plan_configs ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE FloorPlan ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Seating tables
ALTER TABLE seat_inventory ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE seat_reservations ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Session and speaker relations
ALTER TABLE session_speakers ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Cancellation tables
ALTER TABLE cancellation_requests ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Microsite tables
ALTER TABLE microsite_sections ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE microsite_themes ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Notification tables
ALTER TABLE notification_schedule ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE team_notification_members ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
ALTER TABLE user_notifications ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Calendar tables
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Activity log
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Module access
ALTER TABLE module_access_matrix ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Step 2: Create indexes for tenant_id columns (performance optimization)

CREATE INDEX IF NOT EXISTS idx_registrations_tenant ON registrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_tenant ON tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_speakers_tenant ON speakers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sponsors_tenant ON sponsors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exhibitors_tenant ON exhibitors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_registrations_tenant ON exhibitor_registrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_registration_approvals_tenant ON registration_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_registration_custom_fields_tenant ON registration_custom_fields(tenant_id);
CREATE INDEX IF NOT EXISTS idx_registration_settings_tenant ON registration_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_registration_settings_tenant ON event_registration_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_interests_tenant ON rsvp_interests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rsvp_responses_tenant ON rsvp_responses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_tenant ON event_rsvps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_tenant ON event_attendees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_invites_tenant ON event_invites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_planning_tenant ON event_planning(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_team_members_tenant ON event_team_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_ticket_settings_tenant ON event_ticket_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_tenant ON promo_codes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_settings_tenant ON payment_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locations_tenant ON locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_floor_plans_tenant ON floor_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_floor_plan_configs_tenant ON floor_plan_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_FloorPlan_tenant ON FloorPlan(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seat_inventory_tenant ON seat_inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_tenant ON seat_reservations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_session_speakers_tenant ON session_speakers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_tenant ON cancellation_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_microsite_sections_tenant ON microsite_sections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_microsite_themes_tenant ON microsite_themes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_schedule_tenant ON notification_schedule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_notification_members_tenant ON team_notification_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_tenant ON user_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant ON calendar_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_tenant ON activity_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_module_access_matrix_tenant ON module_access_matrix(tenant_id);

-- Step 3: Create default tenant if not exists
INSERT INTO "Tenant" (id, slug, name, subdomain, status, plan, "maxEvents", "maxUsers", "maxStorage", "createdAt", "updatedAt")
VALUES (
  'default-tenant',
  'default',
  'Default Organization',
  'default',
  'ACTIVE',
  'ENTERPRISE',
  999999,
  999999,
  999999,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Migration complete
-- Next step: Run backfill script to populate tenant_id values
