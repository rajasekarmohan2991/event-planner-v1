-- Migration: Create tax_structures table
-- Description: Tax structures for companies to manage different tax rates (GST, VAT, Sales Tax, etc.)

CREATE TABLE IF NOT EXISTS tax_structures (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_custom BOOLEAN DEFAULT FALSE,
    global_template_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_tax_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tax_structures_tenant ON tax_structures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tax_structures_default ON tax_structures(tenant_id, is_default);

-- Insert default tax structures for existing companies
-- This will auto-populate GST 18% for Indian companies
INSERT INTO tax_structures (id, tenant_id, name, rate, description, is_default, is_custom, created_at, updated_at)
SELECT 
    'tax_' || t.id || '_gst18',
    t.id,
    'GST (18%)',
    18.00,
    'Goods and Services Tax - Standard Rate',
    TRUE,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tax_structures ts WHERE ts.tenant_id = t.id
);

-- Also add CGST + SGST breakdown option (9% + 9% = 18%)
INSERT INTO tax_structures (id, tenant_id, name, rate, description, is_default, is_custom, created_at, updated_at)
SELECT 
    'tax_' || t.id || '_cgst9',
    t.id,
    'CGST (9%)',
    9.00,
    'Central Goods and Services Tax',
    FALSE,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tax_structures ts WHERE ts.tenant_id = t.id AND ts.name = 'CGST (9%)'
);

INSERT INTO tax_structures (id, tenant_id, name, rate, description, is_default, is_custom, created_at, updated_at)
SELECT 
    'tax_' || t.id || '_sgst9',
    t.id,
    'SGST (9%)',
    9.00,
    'State Goods and Services Tax',
    FALSE,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tax_structures ts WHERE ts.tenant_id = t.id AND ts.name = 'SGST (9%)'
);

-- Add other common GST rates
INSERT INTO tax_structures (id, tenant_id, name, rate, description, is_default, is_custom, created_at, updated_at)
SELECT 
    'tax_' || t.id || '_gst5',
    t.id,
    'GST (5%)',
    5.00,
    'Goods and Services Tax - Reduced Rate',
    FALSE,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tax_structures ts WHERE ts.tenant_id = t.id AND ts.name = 'GST (5%)'
);

INSERT INTO tax_structures (id, tenant_id, name, rate, description, is_default, is_custom, created_at, updated_at)
SELECT 
    'tax_' || t.id || '_gst12',
    t.id,
    'GST (12%)',
    12.00,
    'Goods and Services Tax - Medium Rate',
    FALSE,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tax_structures ts WHERE ts.tenant_id = t.id AND ts.name = 'GST (12%)'
);

INSERT INTO tax_structures (id, tenant_id, name, rate, description, is_default, is_custom, created_at, updated_at)
SELECT 
    'tax_' || t.id || '_gst28',
    t.id,
    'GST (28%)',
    28.00,
    'Goods and Services Tax - Luxury Rate',
    FALSE,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tax_structures ts WHERE ts.tenant_id = t.id AND ts.name = 'GST (28%)'
);

-- Add zero-rated option
INSERT INTO tax_structures (id, tenant_id, name, rate, description, is_default, is_custom, created_at, updated_at)
SELECT 
    'tax_' || t.id || '_notax',
    t.id,
    'No Tax',
    0.00,
    'Tax Exempt / Zero Rated',
    FALSE,
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM tax_structures ts WHERE ts.tenant_id = t.id AND ts.name = 'No Tax'
);

COMMENT ON TABLE tax_structures IS 'Tax structures (GST, VAT, Sales Tax) configured for each company';
COMMENT ON COLUMN tax_structures.rate IS 'Tax rate as percentage (e.g., 18.00 for 18%)';
COMMENT ON COLUMN tax_structures.is_default IS 'Whether this is the default tax structure for the company';
COMMENT ON COLUMN tax_structures.is_custom IS 'Whether this is a custom tax created by the company (vs. from template)';
COMMENT ON COLUMN tax_structures.global_template_id IS 'Reference to global tax template if created from one';
