-- Migration: Add Global Tax Templates and Enhanced Tax Structures
-- Date: 2026-01-13
-- Description: Creates global_tax_templates table and adds linking fields to tax_structures

-- 1. Create GlobalTaxTemplate table
CREATE TABLE IF NOT EXISTS global_tax_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rate DOUBLE PRECISION NOT NULL,
    description TEXT,
    tax_type VARCHAR(50) DEFAULT 'GST',
    country_code VARCHAR(2),
    
    -- Status & Availability
    is_active BOOLEAN DEFAULT true,
    
    -- Effective Date Range
    effective_from TIMESTAMP,
    effective_until TIMESTAMP,
    
    -- Application Rules
    applies_to VARCHAR(50) DEFAULT 'ALL',
    is_compound BOOLEAN DEFAULT false,
    
    -- Audit
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create indexes for global_tax_templates
CREATE INDEX IF NOT EXISTS idx_global_tax_templates_country ON global_tax_templates(country_code);
CREATE INDEX IF NOT EXISTS idx_global_tax_templates_active ON global_tax_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_global_tax_templates_effective ON global_tax_templates(effective_from);

-- 3. Add new columns to tax_structures table
DO $$ 
BEGIN
    -- Add global_template_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tax_structures' AND column_name = 'global_template_id'
    ) THEN
        ALTER TABLE tax_structures ADD COLUMN global_template_id VARCHAR(255);
    END IF;

    -- Add is_custom column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tax_structures' AND column_name = 'is_custom'
    ) THEN
        ALTER TABLE tax_structures ADD COLUMN is_custom BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_tax_structures_global_template'
    ) THEN
        ALTER TABLE tax_structures 
        ADD CONSTRAINT fk_tax_structures_global_template 
        FOREIGN KEY (global_template_id) 
        REFERENCES global_tax_templates(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Create index on global_template_id
CREATE INDEX IF NOT EXISTS idx_tax_structures_global_template ON tax_structures(global_template_id);

-- 6. Seed some default global tax templates
INSERT INTO global_tax_templates (id, name, rate, description, tax_type, country_code, is_active, applies_to, created_at, updated_at)
SELECT 
    'gtt_' || md5(random()::text) || '_' || extract(epoch from now())::text,
    name, rate, description, tax_type, country_code, true, 'ALL', NOW(), NOW()
FROM (VALUES
    ('GST 18%', 18.0, 'Standard GST rate for goods and services', 'GST', 'IN'),
    ('GST 12%', 12.0, 'Reduced GST rate', 'GST', 'IN'),
    ('GST 5%', 5.0, 'Lower GST rate for essential items', 'GST', 'IN'),
    ('GST 0%', 0.0, 'Zero-rated GST', 'GST', 'IN'),
    ('VAT 20%', 20.0, 'Standard VAT rate', 'VAT', 'GB'),
    ('VAT 5%', 5.0, 'Reduced VAT rate', 'VAT', 'GB'),
    ('VAT 0%', 0.0, 'Zero-rated VAT', 'VAT', 'GB'),
    ('Sales Tax 7.5%', 7.5, 'Standard sales tax rate', 'SALES_TAX', 'US'),
    ('No Tax', 0.0, 'No tax applicable', 'OTHER', NULL),
    ('GST 10%', 10.0, 'Australian GST', 'GST', 'AU'),
    ('GST 5%', 5.0, 'Canadian GST', 'GST', 'CA'),
    ('HST 13%', 13.0, 'Harmonized Sales Tax (Ontario)', 'GST', 'CA'),
    ('VAT 19%', 19.0, 'German VAT (MwSt)', 'VAT', 'DE'),
    ('VAT 7%', 7.0, 'Reduced German VAT', 'VAT', 'DE'),
    ('TVA 20%', 20.0, 'French VAT', 'VAT', 'FR'),
    ('GST 8%', 8.0, 'Singapore GST', 'GST', 'SG'),
    ('VAT 5%', 5.0, 'UAE VAT', 'VAT', 'AE')
) AS t(name, rate, description, tax_type, country_code)
WHERE NOT EXISTS (
    SELECT 1 FROM global_tax_templates WHERE global_tax_templates.name = t.name AND global_tax_templates.country_code IS NOT DISTINCT FROM t.country_code
);

-- Done!
-- Run: SELECT COUNT(*) FROM global_tax_templates; to verify seed data
