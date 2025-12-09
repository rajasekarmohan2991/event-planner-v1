-- Multi-Tenant Architecture Migration
-- This migration adds multi-tenant support while preserving existing data

-- Step 1: Create Enums
DO $$ BEGIN
    CREATE TYPE "SystemRole" AS ENUM ('SUPER_ADMIN', 'USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TenantRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CANCELLED', 'TRIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add currentTenantId to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "current_tenant_id" TEXT;

-- Step 3: Enhance Tenant table
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subdomain" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "domain" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logo" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT DEFAULT '#3B82F6';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT DEFAULT '#10B981';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "faviconUrl" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'UTC';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "dateFormat" TEXT DEFAULT 'MM/DD/YYYY';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'en';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'FREE';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'TRIAL';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "billingEmail" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "maxEvents" INTEGER DEFAULT 10;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER DEFAULT 5;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "maxStorage" INTEGER DEFAULT 1024;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "emailFromName" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "emailFromAddress" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "emailReplyTo" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "features" JSONB;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Make name NOT NULL (set default for existing rows)
UPDATE "Tenant" SET "name" = "slug" WHERE "name" IS NULL;
ALTER TABLE "Tenant" ALTER COLUMN "name" SET NOT NULL;

-- Step 4: Update existing tenants with subdomain
UPDATE "Tenant" SET "subdomain" = "slug" WHERE "subdomain" IS NULL;

-- Step 5: Add unique constraints and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_subdomain_key" ON "Tenant"("subdomain");
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_domain_key" ON "Tenant"("domain");
CREATE INDEX IF NOT EXISTS "Tenant_status_idx" ON "Tenant"("status");
CREATE INDEX IF NOT EXISTS "Tenant_plan_idx" ON "Tenant"("plan");
CREATE INDEX IF NOT EXISTS "Tenant_subdomain_idx" ON "Tenant"("subdomain");

-- Step 6: Enhance TenantMember table
ALTER TABLE "TenantMember" ADD COLUMN IF NOT EXISTS "permissions" JSONB;
ALTER TABLE "TenantMember" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "TenantMember" ADD COLUMN IF NOT EXISTS "invitedBy" BIGINT;
ALTER TABLE "TenantMember" ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP(3);
ALTER TABLE "TenantMember" ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP(3);
ALTER TABLE "TenantMember" ADD COLUMN IF NOT EXISTS "lastAccessAt" TIMESTAMP(3);
ALTER TABLE "TenantMember" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Update existing members
UPDATE "TenantMember" SET "role" = 'MEMBER' WHERE "role" = 'member';
UPDATE "TenantMember" SET "role" = 'OWNER' WHERE "role" = 'owner';
UPDATE "TenantMember" SET "role" = 'ADMIN' WHERE "role" = 'admin';
UPDATE "TenantMember" SET "joinedAt" = "createdAt" WHERE "joinedAt" IS NULL;

-- Step 7: Add indexes for TenantMember
CREATE INDEX IF NOT EXISTS "TenantMember_tenantId_role_idx" ON "TenantMember"("tenantId", "role");
CREATE INDEX IF NOT EXISTS "TenantMember_tenantId_status_idx" ON "TenantMember"("tenantId", "status");

-- Step 8: Create default tenant if none exists
INSERT INTO "Tenant" (
  id, slug, name, subdomain, status, plan, "createdAt", "updatedAt"
)
SELECT 
  'default-tenant',
  'default',
  'Default Organization',
  'default',
  'ACTIVE',
  'FREE',
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Tenant" WHERE slug = 'default');

-- Step 9: Migrate existing users to default tenant
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

-- Step 10: Set current tenant for all users
UPDATE users SET "current_tenant_id" = 'default-tenant' WHERE "current_tenant_id" IS NULL;
