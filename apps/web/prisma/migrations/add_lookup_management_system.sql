-- ==============================
-- Lookup Management System
-- Replaces hard-coded enums with dynamic database-driven lookups
-- ==============================

-- 1. Lookup Categories Table
-- Stores category definitions (e.g., "BoothType", "RegistrationStatus")
CREATE TABLE IF NOT EXISTS "lookup_categories" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL UNIQUE,
  "code" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "is_global" BOOLEAN DEFAULT true,
  "is_system" BOOLEAN DEFAULT false,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  "tenant_id" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_lookup_categories_code" ON "lookup_categories"("code");
CREATE INDEX IF NOT EXISTS "idx_lookup_categories_tenant" ON "lookup_categories"("tenant_id");

-- 2. Lookup Values Table
-- Stores actual values for each category (e.g., STANDARD, PREMIUM for BoothType)
CREATE TABLE IF NOT EXISTS "lookup_values" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "category_id" TEXT NOT NULL REFERENCES "lookup_categories"("id") ON DELETE CASCADE,
  "value" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "color_code" TEXT,
  "icon" TEXT,
  "sort_order" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT true,
  "is_default" BOOLEAN DEFAULT false,
  "is_system" BOOLEAN DEFAULT false,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  "tenant_id" TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_lookup_values_category_value" ON "lookup_values"("category_id", "value");
CREATE INDEX IF NOT EXISTS "idx_lookup_values_category_active" ON "lookup_values"("category_id", "is_active", "sort_order");
CREATE INDEX IF NOT EXISTS "idx_lookup_values_tenant" ON "lookup_values"("tenant_id");

-- 3. Tenant Lookup Overrides (Optional)
-- Allows tenants to have custom lookup values specific to their organization
CREATE TABLE IF NOT EXISTS "tenant_lookup_values" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenant_id" TEXT NOT NULL,
  "category_id" TEXT NOT NULL REFERENCES "lookup_categories"("id") ON DELETE CASCADE,
  "value" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "color_code" TEXT,
  "icon" TEXT,
  "sort_order" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT true,
  "is_default" BOOLEAN DEFAULT false,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_tenant_lookup_values_unique" ON "tenant_lookup_values"("tenant_id", "category_id", "value");
CREATE INDEX IF NOT EXISTS "idx_tenant_lookup_values_tenant" ON "tenant_lookup_values"("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_tenant_lookup_values_category" ON "tenant_lookup_values"("category_id");

-- 4. Lookup Change History (Audit Trail)
CREATE TABLE IF NOT EXISTS "lookup_audit_log" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "category_id" TEXT,
  "value_id" TEXT,
  "action" TEXT NOT NULL,
  "old_data" JSONB,
  "new_data" JSONB,
  "changed_by" BIGINT,
  "changed_at" TIMESTAMPTZ DEFAULT NOW(),
  "tenant_id" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_lookup_audit_category" ON "lookup_audit_log"("category_id");
CREATE INDEX IF NOT EXISTS "idx_lookup_audit_changed_at" ON "lookup_audit_log"("changed_at");

-- 5. Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_lookup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lookup_categories_updated_at
  BEFORE UPDATE ON "lookup_categories"
  FOR EACH ROW
  EXECUTE FUNCTION update_lookup_updated_at();

CREATE TRIGGER trigger_lookup_values_updated_at
  BEFORE UPDATE ON "lookup_values"
  FOR EACH ROW
  EXECUTE FUNCTION update_lookup_updated_at();

CREATE TRIGGER trigger_tenant_lookup_values_updated_at
  BEFORE UPDATE ON "tenant_lookup_values"
  FOR EACH ROW
  EXECUTE FUNCTION update_lookup_updated_at();

COMMENT ON TABLE "lookup_categories" IS 'Defines lookup categories (e.g., BoothType, RegistrationStatus)';
COMMENT ON TABLE "lookup_values" IS 'Stores global lookup values for each category';
COMMENT ON TABLE "tenant_lookup_values" IS 'Tenant-specific lookup value overrides';
COMMENT ON TABLE "lookup_audit_log" IS 'Audit trail for all lookup changes';
