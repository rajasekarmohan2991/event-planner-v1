# Tax Settings Loading Issue - Fix Guide

## Problem
Company tax settings page shows infinite loading and "No data" message.

## Root Causes

### 1. **Missing `global_tax_templates` Table** ⚠️
The migration to create this table may not have been run on your production database.

### 2. **Complex Prisma Query** ✅ FIXED
The original query had nested OR/AND conditions that caused issues.

---

## Fixes Applied

### Code Fix ✅
**File**: `/apps/web/app/api/company/global-tax-templates/route.ts`

**Changes**:
1. Replaced Prisma ORM query with raw SQL for reliability
2. Added graceful error handling for missing table
3. Returns empty array instead of crashing when table doesn't exist
4. Simplified filtering logic (moved to JavaScript)

```typescript
// Before: Complex Prisma query that failed
const templates = await prisma.globalTaxTemplate.findMany({
  where: { /* complex nested OR/AND */ }
});

// After: Simple raw SQL with error handling
try {
  templates = await prisma.$queryRaw`
    SELECT * FROM global_tax_templates 
    WHERE is_active = true
  `;
} catch (dbError) {
  if (dbError.code === '42P01') {  // Table doesn't exist
    return NextResponse.json({ templates: [] });
  }
}
```

---

## Database Fix Required

### Check if Table Exists

Run this in your Supabase SQL Editor:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'global_tax_templates'
);
```

### If Table is Missing, Create It

Run the migration SQL from `/migrations/add_global_tax_templates.sql`:

```sql
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

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_global_tax_templates_country ON global_tax_templates(country_code);
CREATE INDEX IF NOT EXISTS idx_global_tax_templates_active ON global_tax_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_global_tax_templates_effective ON global_tax_templates(effective_from);

-- 3. Add columns to tax_structures
ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS global_template_id VARCHAR(255);
ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- 4. Create foreign key
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

-- 5. Create index
CREATE INDEX IF NOT EXISTS idx_tax_structures_global_template ON tax_structures(global_template_id);
```

### Seed Default Tax Templates

```sql
-- Insert default templates for common countries
INSERT INTO global_tax_templates (id, name, rate, description, tax_type, country_code, is_active, applies_to, created_at, updated_at)
VALUES
    ('gtt_gst_18_in', 'GST 18%', 18.0, 'Standard GST rate for goods and services', 'GST', 'IN', true, 'ALL', NOW(), NOW()),
    ('gtt_gst_12_in', 'GST 12%', 12.0, 'Reduced GST rate', 'GST', 'IN', true, 'ALL', NOW(), NOW()),
    ('gtt_gst_5_in', 'GST 5%', 5.0, 'Lower GST rate for essential items', 'GST', 'IN', true, 'ALL', NOW(), NOW()),
    ('gtt_gst_0_in', 'GST 0%', 0.0, 'Zero-rated GST', 'GST', 'IN', true, 'ALL', NOW(), NOW()),
    ('gtt_vat_20_gb', 'VAT 20%', 20.0, 'Standard VAT rate', 'VAT', 'GB', true, 'ALL', NOW(), NOW()),
    ('gtt_vat_5_gb', 'VAT 5%', 5.0, 'Reduced VAT rate', 'VAT', 'GB', true, 'ALL', NOW(), NOW()),
    ('gtt_sales_7_5_us', 'Sales Tax 7.5%', 7.5, 'Standard sales tax rate', 'SALES_TAX', 'US', true, 'ALL', NOW(), NOW()),
    ('gtt_no_tax', 'No Tax', 0.0, 'No tax applicable', 'OTHER', NULL, true, 'ALL', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

---

## Testing After Fix

### 1. Verify Table Exists
```sql
SELECT COUNT(*) FROM global_tax_templates;
```

### 2. Test API Endpoint
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-domain.com/api/company/global-tax-templates
```

### 3. Test in Browser
1. Login as company admin
2. Navigate to `/admin/settings/tax`
3. Should see either:
   - List of available global templates (if table exists with data)
   - Empty state with "No global templates available" (if table exists but empty)
   - No infinite loading

---

## Country-Based Filtering

The API now filters templates based on company country:

- **Company in India (IN)**: Shows GST templates + global templates
- **Company in UK (GB)**: Shows VAT templates + global templates
- **Company in US**: Shows Sales Tax templates + global templates
- **No country set**: Shows all templates

To set company country:
```sql
UPDATE tenants SET country = 'IN' WHERE id = 'your-tenant-id';
```

---

## Deployment Status

**Git Commit**: `c7827da`
**Branch**: `main`
**Status**: ✅ Pushed to GitHub

**Files Changed**:
- `/apps/web/app/api/company/global-tax-templates/route.ts`

---

## Quick Fix Checklist

- [ ] Run table creation SQL in Supabase
- [ ] Seed default tax templates
- [ ] Verify table exists with `SELECT COUNT(*)`
- [ ] Test API endpoint returns data
- [ ] Test company tax settings page loads
- [ ] Set company country code if needed

---

**After completing these steps, the tax settings page should load properly!**
