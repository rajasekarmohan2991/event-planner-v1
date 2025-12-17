-- Performance Optimization: Database Indexes (Minimal Critical Set)
-- This migration adds only the most critical indexes for performance

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON "events"("tenant_id");
CREATE INDEX IF NOT EXISTS idx_events_status ON "events"("status");
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON "events"("starts_at");
CREATE INDEX IF NOT EXISTS idx_events_tenant_status ON "events"("tenant_id", "status");

-- Registrations table indexes  
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON "registrations"("event_id");
CREATE INDEX IF NOT EXISTS idx_registrations_email ON "registrations"("email");
CREATE INDEX IF NOT EXISTS idx_registrations_status ON "registrations"("status");
CREATE INDEX IF NOT EXISTS idx_registrations_event_status ON "registrations"("event_id", "status");

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON "users"("email");
CREATE INDEX IF NOT EXISTS idx_users_role ON "users"("role");

-- TenantMember indexes
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON "tenant_members"("userId");
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON "tenant_members"("tenantId");

-- Tenant indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON "tenants"("slug");
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON "tenants"("subdomain");
