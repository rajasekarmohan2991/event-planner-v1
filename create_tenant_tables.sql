-- Create Tenant and TenantMember tables

-- Create Tenant table
CREATE TABLE IF NOT EXISTS "Tenant" (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  domain TEXT UNIQUE,
  
  -- Branding
  logo TEXT,
  "primaryColor" TEXT DEFAULT '#3B82F6',
  "secondaryColor" TEXT DEFAULT '#10B981',
  "faviconUrl" TEXT,
  
  -- Settings
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  "dateFormat" TEXT DEFAULT 'MM/DD/YYYY',
  locale TEXT DEFAULT 'en',
  
  -- Subscription & Billing
  plan TEXT DEFAULT 'FREE',
  status TEXT DEFAULT 'TRIAL',
  "billingEmail" TEXT,
  "maxEvents" INTEGER DEFAULT 10,
  "maxUsers" INTEGER DEFAULT 5,
  "maxStorage" INTEGER DEFAULT 1024,
  
  -- Trial & Subscription
  "trialEndsAt" TIMESTAMP(3),
  "subscriptionStartedAt" TIMESTAMP(3),
  "subscriptionEndsAt" TIMESTAMP(3),
  
  -- Email Configuration
  "emailFromName" TEXT,
  "emailFromAddress" TEXT,
  "emailReplyTo" TEXT,
  
  -- Feature Flags
  features JSONB,
  metadata JSONB,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3)
);

-- Create indexes for Tenant
CREATE INDEX IF NOT EXISTS "Tenant_status_idx" ON "Tenant"(status);
CREATE INDEX IF NOT EXISTS "Tenant_plan_idx" ON "Tenant"(plan);
CREATE INDEX IF NOT EXISTS "Tenant_subdomain_idx" ON "Tenant"(subdomain);

-- Create TenantMember table
CREATE TABLE IF NOT EXISTS "TenantMember" (
  id TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "userId" BIGINT NOT NULL,
  role TEXT DEFAULT 'MEMBER' NOT NULL,
  
  -- Permissions
  permissions JSONB,
  
  -- Status
  status TEXT DEFAULT 'ACTIVE',
  "invitedBy" BIGINT,
  "invitedAt" TIMESTAMP(3),
  "joinedAt" TIMESTAMP(3),
  "lastAccessAt" TIMESTAMP(3),
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "TenantMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id) ON DELETE CASCADE,
  CONSTRAINT "TenantMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT "TenantMember_tenantId_userId_key" UNIQUE ("tenantId", "userId")
);

-- Create indexes for TenantMember
CREATE INDEX IF NOT EXISTS "TenantMember_userId_idx" ON "TenantMember"("userId");
CREATE INDEX IF NOT EXISTS "TenantMember_tenantId_role_idx" ON "TenantMember"("tenantId", role);
CREATE INDEX IF NOT EXISTS "TenantMember_tenantId_status_idx" ON "TenantMember"("tenantId", status);

-- Add current_tenant_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_tenant_id TEXT;

-- Create default tenant
INSERT INTO "Tenant" (
  id, slug, name, subdomain, status, plan, "createdAt", "updatedAt"
)
VALUES (
  'default-tenant',
  'default',
  'Default Organization',
  'default',
  'ACTIVE',
  'FREE',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Migrate existing users to default tenant
INSERT INTO "TenantMember" (
  id, "tenantId", "userId", role, status, "joinedAt", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid()::text,
  'default-tenant',
  id,
  'OWNER',
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM "TenantMember" 
  WHERE "userId" = users.id AND "tenantId" = 'default-tenant'
);

-- Set current tenant for all users
UPDATE users SET current_tenant_id = 'default-tenant' WHERE current_tenant_id IS NULL;
