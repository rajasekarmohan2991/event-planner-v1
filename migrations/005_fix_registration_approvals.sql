-- Fix registration_approvals table
ALTER TABLE registration_approvals ADD COLUMN IF NOT EXISTS registration_id BIGINT;
ALTER TABLE registration_approvals ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_registration_approvals_reg ON registration_approvals(registration_id);
CREATE INDEX IF NOT EXISTS idx_registration_approvals_tenant ON registration_approvals(tenant_id);
