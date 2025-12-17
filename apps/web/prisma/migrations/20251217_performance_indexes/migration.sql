-- Performance Optimization: Database Indexes
-- This migration adds indexes to improve query performance

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON "Event"("tenantId");
CREATE INDEX IF NOT EXISTS idx_events_status ON "Event"("status");
CREATE INDEX IF NOT EXISTS idx_events_start_date ON "Event"("startDate");
CREATE INDEX IF NOT EXISTS idx_events_created_at ON "Event"("createdAt");
CREATE INDEX IF NOT EXISTS idx_events_tenant_status ON "Event"("tenantId", "status");

-- Registrations table indexes
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON "Registration"("eventId");
CREATE INDEX IF NOT EXISTS idx_registrations_user_email ON "Registration"("email");
CREATE INDEX IF NOT EXISTS idx_registrations_status ON "Registration"("status");
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON "Registration"("eventId", "status");
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON "Registration"("createdAt");

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON "User"("email");
CREATE INDEX IF NOT EXISTS idx_users_role ON "User"("role");
CREATE INDEX IF NOT EXISTS idx_users_current_tenant ON "User"("currentTenantId");

-- TenantMember indexes
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON "TenantMember"("userId");
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON "TenantMember"("tenantId");
CREATE INDEX IF NOT EXISTS idx_tenant_members_role ON "TenantMember"("role");
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_user ON "TenantMember"("tenantId", "userId");

-- EventTeamMember indexes
CREATE INDEX IF NOT EXISTS idx_event_team_event_id ON "EventTeamMember"("eventId");
CREATE INDEX IF NOT EXISTS idx_event_team_email ON "EventTeamMember"("email");
CREATE INDEX IF NOT EXISTS idx_event_team_status ON "EventTeamMember"("status");

-- SeatInventory indexes (for seat selection performance)
CREATE INDEX IF NOT EXISTS idx_seat_inventory_event_id ON "SeatInventory"("eventId");
CREATE INDEX IF NOT EXISTS idx_seat_inventory_available ON "SeatInventory"("isAvailable");
CREATE INDEX IF NOT EXISTS idx_seat_inventory_event_available ON "SeatInventory"("eventId", "isAvailable");
CREATE INDEX IF NOT EXISTS idx_seat_inventory_section ON "SeatInventory"("section");

-- SeatReservation indexes
CREATE INDEX IF NOT EXISTS idx_seat_reservations_seat_id ON "SeatReservation"("seatId");
CREATE INDEX IF NOT EXISTS idx_seat_reservations_status ON "SeatReservation"("status");
CREATE INDEX IF NOT EXISTS idx_seat_reservations_expires_at ON "SeatReservation"("expiresAt");

-- Tenant indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON "Tenant"("slug");
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON "Tenant"("subdomain");
CREATE INDEX IF NOT EXISTS idx_tenants_status ON "Tenant"("status");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_tenant_date ON "Event"("tenantId", "startDate" DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_event_created ON "Registration"("eventId", "createdAt" DESC);
