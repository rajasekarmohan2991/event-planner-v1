-- Migration: Create tenant and tenant_members tables
-- Phase 1: Multi-tenant architecture foundation

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(255) PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(255) UNIQUE,
  
  -- Branding
  logo TEXT,
  "primaryColor" VARCHAR(50) DEFAULT '#3B82F6',
  "secondaryColor" VARCHAR(50) DEFAULT '#10B981',
  "faviconUrl" TEXT,
  
  -- Settings
  timezone VARCHAR(100) DEFAULT 'UTC',
  currency VARCHAR(10) DEFAULT 'USD',
  "dateFormat" VARCHAR(50) DEFAULT 'MM/DD/YYYY',
  locale VARCHAR(10) DEFAULT 'en',
  
  -- Subscription & Billing
  plan VARCHAR(50) DEFAULT 'FREE',
  status VARCHAR(50) DEFAULT 'TRIAL',
  "billingEmail" VARCHAR(255),
  "maxEvents" INTEGER DEFAULT 10,
  "maxUsers" INTEGER DEFAULT 5,
  "maxStorage" INTEGER DEFAULT 1024,
  
  -- Trial & Subscription
  "trialEndsAt" TIMESTAMP,
  "subscriptionStartedAt" TIMESTAMP,
  "subscriptionEndsAt" TIMESTAMP,
  
  -- Email Configuration
  "emailFromName" VARCHAR(255),
  "emailFromAddress" VARCHAR(255),
  "emailReplyTo" VARCHAR(255),
  
  -- Feature Flags
  features JSONB,
  metadata JSONB,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "deletedAt" TIMESTAMP
);

-- Create indexes for tenants
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- Create tenant_members table
CREATE TABLE IF NOT EXISTS tenant_members (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" VARCHAR(255) NOT NULL,
  "userId" BIGINT NOT NULL,
  role VARCHAR(50) DEFAULT 'MEMBER',
  
  -- Permissions
  permissions JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'ACTIVE',
  "invitedBy" BIGINT,
  "invitedAt" TIMESTAMP,
  "joinedAt" TIMESTAMP,
  "lastAccessAt" TIMESTAMP,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_tenant_members_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_tenant_members_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE("tenantId", "userId")
);

-- Create indexes for tenant_members
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members("userId");
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_role ON tenant_members("tenantId", role);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_status ON tenant_members("tenantId", status);

-- Add current_tenant_id to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS "currentTenantId" VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_current_tenant ON users("currentTenantId");

-- Create default tenant
INSERT INTO tenants (
  id, 
  slug, 
  name, 
  subdomain, 
  status, 
  plan, 
  "maxEvents", 
  "maxUsers", 
  "maxStorage",
  "createdAt",
  "updatedAt"
)
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
COMMENT ON TABLE tenants IS 'Multi-tenant organizations/companies';
COMMENT ON TABLE tenant_members IS 'User membership in tenants with roles';
