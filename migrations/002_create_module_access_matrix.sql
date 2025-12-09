-- Create module_access_matrix table
CREATE TABLE IF NOT EXISTS module_access_matrix (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  module_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  tenant_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module_name, role)
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_module_access_matrix_tenant ON module_access_matrix(tenant_id);

-- Add tenant_id to exhibitors if not exists (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exhibitors' AND column_name = 'tenant_id') THEN
        ALTER TABLE exhibitors ADD COLUMN tenant_id VARCHAR(255);
        CREATE INDEX idx_exhibitors_tenant ON exhibitors(tenant_id);
    END IF;
END
$$;
