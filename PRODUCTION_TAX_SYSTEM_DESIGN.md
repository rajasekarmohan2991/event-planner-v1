# Production-Grade Tax Configuration System

## 🎯 Overview
This document outlines the production-ready tax configuration system for the Event Planner platform, supporting country-specific tax rules, event-level overrides, and compliance requirements.

## 📐 Architecture

### Hierarchy
```
Global Tax Templates (Read-only, 15+ countries)
    ↓
Company/Tenant Tax Configurations (Country-based, customizable)
    ↓
Event Tax Settings (Optional override)
    ↓
Invoice Line Items (Final calculation with applied tax)
```

## 🗄️ Database Schema

### Current Schema (Already Implemented)
```prisma
model TaxStructure {
  id          String   @id @default(cuid())
  name        String
  rate        Float
  description String?
  isDefault   Boolean  @default(false)
  tenantId    String?
  tenant      Tenant?  @relation(fields: [tenantId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Tenant {
  country         String   @default("US")  // ✅ Already exists
  currency        String   @default("USD") // ✅ Already exists
  taxStructures   TaxStructure[]           // ✅ Already exists
}

model InvoiceLineItem {
  taxRate     Float    @default(0)  // ✅ Already exists
  taxAmount   Float    @default(0)  // ✅ Already exists
}
```

### Recommended Enhancements

#### 1. Enhanced TaxStructure (Add these columns)
```sql
-- Add to existing tax_structures table
ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS tax_type VARCHAR(50); -- GST, VAT, SALES_TAX, SERVICE_TAX
ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS is_compound BOOLEAN DEFAULT false;
ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS applies_to VARCHAR(50) DEFAULT 'ALL'; -- ALL, TICKETS, SPONSORS, EXHIBITORS, VENDORS
ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS effective_from DATE;
ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS effective_until DATE;
ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS tax_registration_number VARCHAR(100);
```

#### 2. Event Tax Configuration (New table)
```sql
CREATE TABLE IF NOT EXISTS event_tax_settings (
    id VARCHAR(255) PRIMARY KEY,
    event_id BIGINT NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Tax override settings
    use_custom_tax BOOLEAN DEFAULT false,
    tax_structure_id VARCHAR(255), -- FK to tax_structures
    custom_tax_rate FLOAT,
    custom_tax_name VARCHAR(100),
    
    -- Tax exemption
    is_tax_exempt BOOLEAN DEFAULT false,
    exemption_reason TEXT,
    exemption_certificate_url VARCHAR(500),
    
    -- Compliance
    tax_invoice_prefix VARCHAR(20),
    include_tax_breakdown BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (tax_structure_id) REFERENCES tax_structures(id) ON DELETE SET NULL
);

CREATE INDEX idx_event_tax_settings_event ON event_tax_settings(event_id);
CREATE INDEX idx_event_tax_settings_tenant ON event_tax_settings(tenant_id);
```

#### 3. Tax Exemption Categories (New table)
```sql
CREATE TABLE IF NOT EXISTS tax_exemption_categories (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    requires_certificate BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

## 🔧 Implementation Plan

### Phase 1: Database Schema Updates (Immediate)
1. Add columns to `tax_structures` table
2. Create `event_tax_settings` table
3. Create `tax_exemption_categories` table
4. Update `ensureSchema()` function

### Phase 2: API Endpoints (Core Functionality)

#### Company Tax Management
- `GET /api/super-admin/companies/[id]/tax-structures` ✅ Already exists
- `POST /api/super-admin/companies/[id]/tax-structures` ✅ Already exists
- `PATCH /api/super-admin/companies/[id]/tax-structures/[taxId]` ✅ Already exists
- `DELETE /api/super-admin/companies/[id]/tax-structures/[taxId]` ✅ Already exists

#### Event Tax Configuration (New)
- `GET /api/events/[id]/tax-settings` - Get event tax configuration
- `POST /api/events/[id]/tax-settings` - Create/update event tax settings
- `GET /api/events/[id]/tax-structures/available` - Get available tax structures for event

#### Tax Calculation Service (New)
- `POST /api/tax/calculate` - Calculate tax for given amount and context
- `GET /api/tax/validate` - Validate tax configuration

### Phase 3: Tax Calculation Logic

```typescript
// lib/tax-calculator.ts
interface TaxCalculationContext {
  tenantId: string;
  eventId?: string;
  amount: number;
  itemType: 'TICKET' | 'SPONSOR' | 'EXHIBITOR' | 'VENDOR' | 'OTHER';
  recipientCountry?: string;
  isExempt?: boolean;
}

interface TaxCalculationResult {
  subtotal: number;
  taxes: Array<{
    name: string;
    rate: number;
    amount: number;
    type: string;
  }>;
  taxTotal: number;
  grandTotal: number;
}

async function calculateTax(context: TaxCalculationContext): Promise<TaxCalculationResult>
```

### Phase 4: UI Components

#### Company Tax Settings Page
- Location: `/super-admin/companies/[id]/tax-structures` ✅ Already exists
- Features:
  - List all tax structures
  - Add/Edit/Delete tax rates
  - Set default tax
  - Country-based auto-population ✅ Already working

#### Event Tax Settings (New)
- Location: `/events/[id]/settings/tax`
- Features:
  - Use company default or custom tax
  - Select from available tax structures
  - Tax exemption settings
  - Preview tax calculation

#### Invoice Generation (Enhanced)
- Auto-apply correct tax based on:
  1. Event tax settings (if configured)
  2. Company default tax (fallback)
  3. Item type-specific tax rules

## 🌍 Country-Specific Tax Rules

### Already Supported (15+ countries):
- 🇺🇸 United States - Sales Tax (7.5%)
- 🇮🇳 India - GST (18%, 12%, 5%, 0%)
- 🇬🇧 United Kingdom - VAT (20%, 5%, 0%)
- 🇨🇦 Canada - GST/HST (5%, 13%, 15%)
- 🇦🇺 Australia - GST (10%)
- 🇪🇺 European Union - VAT (20%, 10%, 5%, 0%)
- 🇩🇪 Germany - MwSt (19%, 7%)
- 🇫🇷 France - TVA (20%, 10%, 5.5%, 2.1%)
- 🇸🇬 Singapore - GST (8%)
- 🇦🇪 UAE - VAT (5%)
- 🇯🇵 Japan - Consumption Tax (10%, 8%)
- 🇨🇳 China - VAT (13%, 9%, 6%)
- 🇧🇷 Brazil - ICMS/ISS (18%, 5%)
- 🇲🇽 Mexico - IVA (16%)
- 🇿🇦 South Africa - VAT (15%)
- 🇳🇿 New Zealand - GST (15%)

### Special Cases to Handle:

#### India (Complex GST Structure)
```javascript
// CGST + SGST = 18% (9% + 9% for intra-state)
// IGST = 18% (for inter-state)
// Requires: GSTIN validation, HSN/SAC codes
```

#### USA (State-based)
```javascript
// Different rates per state (0% - 10%)
// Nexus rules for online events
// Sales tax exemption certificates
```

#### EU (Cross-border VAT)
```javascript
// Reverse charge mechanism for B2B
// VAT MOSS for B2C digital services
// VAT number validation
```

## 📊 Tax Reporting & Compliance

### Reports to Generate
1. **Tax Summary Report**
   - Total tax collected by type
   - Tax collected by country/region
   - Tax collected by event
   - Period: Monthly, Quarterly, Annual

2. **Tax Liability Report**
   - Tax payable to government
   - Tax collected but not remitted
   - Due dates and filing requirements

3. **Invoice Tax Breakdown**
   - Per invoice tax details
   - Exemption tracking
   - Audit trail

### Compliance Features
- Tax registration number storage
- Tax invoice numbering (sequential, per country rules)
- Digital signature for tax invoices (India GST requirement)
- Tax exemption certificate storage
- Historical tax rate tracking (for audits)

## 🔐 Security & Validation

### Tax Rate Validation
```typescript
// Validate tax rate is within acceptable range
function validateTaxRate(rate: number, country: string): boolean {
  const limits = {
    'IN': { min: 0, max: 28 },  // GST max is 28%
    'US': { min: 0, max: 15 },  // Sales tax rarely exceeds 15%
    'GB': { min: 0, max: 20 },  // VAT max is 20%
    // ... other countries
  };
  
  const limit = limits[country] || { min: 0, max: 30 };
  return rate >= limit.min && rate <= limit.max;
}
```

### Tax Calculation Audit Trail
```sql
CREATE TABLE IF NOT EXISTS tax_calculation_log (
    id VARCHAR(255) PRIMARY KEY,
    invoice_id VARCHAR(255),
    calculation_date TIMESTAMP DEFAULT NOW(),
    input_data JSONB,
    output_data JSONB,
    tax_rules_applied JSONB,
    created_by VARCHAR(255)
);
```

## 🚀 Migration Strategy

### Step 1: Schema Migration (Zero Downtime)
```sql
-- Add new columns with defaults
-- Create new tables
-- Backfill existing data
```

### Step 2: Data Migration
```typescript
// Migrate existing tax data to new structure
// Populate event_tax_settings for existing events
// Set default tax structures based on tenant country
```

### Step 3: API Rollout
```typescript
// Deploy new endpoints
// Update invoice generation to use new tax calculation
// Maintain backward compatibility
```

### Step 4: UI Rollout
```typescript
// Deploy event tax settings UI
// Update invoice creation forms
// Add tax reporting dashboards
```

## 📝 Usage Examples

### Example 1: Company Sets Up Tax (India)
```typescript
// Auto-populated when company country = 'IN'
// Tax structures created:
// - GST 18% (default)
// - GST 12%
// - GST 5%
// - GST 0%
```

### Example 2: Event Overrides Tax
```typescript
// Event: "Charity Fundraiser"
// Override: Tax Exempt
// Reason: "Registered charity event"
// Certificate: "charity_cert_2026.pdf"
```

### Example 3: Invoice Calculation
```typescript
// Ticket: ₹1000
// Tax: GST 18% (₹180)
// Total: ₹1180

// Sponsor Package: ₹50,000
// Tax: GST 18% (₹9,000)
// Total: ₹59,000
```

## 🎯 Success Metrics

1. **Accuracy**: 100% correct tax calculation
2. **Compliance**: All invoices meet local tax requirements
3. **Flexibility**: Support for 20+ countries
4. **Performance**: Tax calculation < 100ms
5. **Audit**: Complete tax trail for 7 years

## 🔄 Maintenance

### Regular Updates Required
- Tax rate changes (government announcements)
- New country support (as business expands)
- Compliance rule updates (regulatory changes)
- Tax template refinements (user feedback)

### Monitoring
- Tax calculation errors
- Invalid tax configurations
- Missing tax data
- Compliance violations

---

**Status**: Ready for Implementation
**Priority**: High (Finance/Compliance Critical)
**Estimated Effort**: 3-5 days for full implementation
