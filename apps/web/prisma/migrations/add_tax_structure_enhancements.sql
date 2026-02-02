-- Tax Structure Enhancement Migration
-- Adds effective dates, country support, and currency conversion

-- 1. Add new columns to tax_structures table
ALTER TABLE tax_structures 
ADD COLUMN IF NOT EXISTS effective_from TIMESTAMP,
ADD COLUMN IF NOT EXISTS effective_to TIMESTAMP,
ADD COLUMN IF NOT EXISTS country_code VARCHAR(2),
ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

-- 2. Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_tax_structures_effective ON tax_structures(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_tax_structures_country ON tax_structures(country_code);
CREATE INDEX IF NOT EXISTS idx_tax_structures_tenant_active ON tax_structures(tenant_id, archived) WHERE archived = FALSE;

-- 3. Update existing records to have effective_from as created_at
UPDATE tax_structures 
SET effective_from = created_at 
WHERE effective_from IS NULL;

-- 4. Create tax_structure_history table for audit trail
CREATE TABLE IF NOT EXISTS tax_structure_history (
    id TEXT PRIMARY KEY,
    tax_structure_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    description TEXT,
    country_code VARCHAR(2),
    currency_code VARCHAR(3),
    effective_from TIMESTAMP,
    effective_to TIMESTAMP,
    changed_by TEXT,
    changed_at TIMESTAMP DEFAULT NOW(),
    change_reason TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tax_history_structure ON tax_structure_history(tax_structure_id);
CREATE INDEX IF NOT EXISTS idx_tax_history_tenant ON tax_structure_history(tenant_id);

-- 5. Add comments for documentation
COMMENT ON COLUMN tax_structures.effective_from IS 'Date/time when this tax rate becomes effective';
COMMENT ON COLUMN tax_structures.effective_to IS 'Date/time when this tax rate expires (NULL = no expiry)';
COMMENT ON COLUMN tax_structures.country_code IS 'ISO 3166-1 alpha-2 country code (e.g., US, AU, IN)';
COMMENT ON COLUMN tax_structures.currency_code IS 'ISO 4217 currency code for this tax (e.g., USD, AUD, INR)';
COMMENT ON COLUMN tax_structures.archived IS 'Soft delete flag - archived taxes are hidden but preserved';
