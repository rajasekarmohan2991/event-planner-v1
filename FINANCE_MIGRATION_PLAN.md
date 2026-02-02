# ZERO-DAMAGE FINANCE MIGRATION PLAN
## From Super-Admin Finance → Tenant-Owned Finance

---

## 📊 CURRENT STATE ANALYSIS

### Database Structure (Existing)

#### ✅ Already Multi-Tenant Ready:
```prisma
✓ Tenant model exists (line 129)
✓ tenantId already in:
  - Invoice (line 1667)
  - InvoiceLineItem (via Invoice)
  - Payment (via Invoice)
  - Receipt (via Invoice)
  - Payout (line 1785)
  - TaxStructure (line 1650)
  - FinanceSettings (line 1898) - 1:1 with Tenant
```

#### ✅ Tax System Status:
```prisma
✓ GlobalTaxTemplate exists (line 1603)
  - Super Admin creates these
  - Has rate, taxType, countryCode
  - Has effectiveFrom/effectiveUntil
  - Has appliesTo field

✓ TaxStructure exists (line 1636)
  - Already tenant-scoped (tenantId line 1650)
  - Links to GlobalTaxTemplate (optional)
  - Has isCustom flag (line 1648)
  - Can override global template
```

#### ⚠️ Critical Gaps Found:

1. **NO Version Field in Invoice**
   ```
   Missing: finance_version field
   Impact: Cannot distinguish v1 vs v2 invoices
   ```

2. **NO Tax Snapshot**
   ```
   InvoiceLineItem has:
   - taxRate (line 1726)
   - taxAmount (line 1727)
   BUT no tax name or tax_id snapshot
   Impact: Can't audit which tax was applied
   ```

3. **NO Finance Mode Flag**
   ```
   Tenant model missing: finance_mode field
   Impact: Can't control which system a tenant uses
   ```

4. **NO Document Sequence Management**
   ```
   Missing: Per-tenant invoice numbering control
   Current: invoicePrefix in FinanceSettings (line 1923)
   Gap: No sequence number management
   ```

5. **NO Permission System for Finance**
   ```
   TenantMember has generic permissions (line 197)
   Missing: Specific finance permissions/roles
   ```

---

## 🎯 MIGRATION IMPACT ANALYSIS

### DATABASE CHANGES REQUIRED

#### Phase 0: Version Tagging (ZERO BREAKING CHANGES)
```prisma
// Add to Invoice model (line 1665)
model Invoice {
  // ... existing fields ...
  financeVersion  String  @default("v1") @map("finance_version")  // NEW
  // ... rest of fields ...
}
```
**Impact:** 
- ✅ Existing data gets "v1" by default
- ✅ No code changes needed
- ✅ No API changes needed

#### Phase 1: Add Tenant Finance Mode (ZERO BREAKING CHANGES)
```prisma
// Add to Tenant model (line 129)
model Tenant {
  // ... existing fields ...
  financeMode     String  @default("legacy") // "legacy" | "tenant" | "hybrid"
  // ... rest of fields ...
}
```
**Impact:**
- ✅ All existing tenants = "legacy"
- ✅ New invoices continue working
- ✅ No behavior change

#### Phase 2: Tax Snapshot Protection (CRITICAL - NO BREAKING CHANGE)
```prisma
// NEW MODEL - Add after InvoiceLineItem
model InvoiceTaxSnapshot {
  id              String  @id @default(cuid())
  invoiceId       String  @map("invoice_id")
  lineItemId      String? @map("line_item_id")  // null = invoice-level tax
  
  // Tax Identity Snapshot
  taxId           String?  @map("tax_id")       // TaxStructure or GlobalTax ID
  taxSource       String   // "GLOBAL_TEMPLATE" | "TENANT_CUSTOM" | "MANUAL"
  taxName         String
  taxType         String   // GST, VAT, etc
  taxRate         Float
  
  // Calculation Snapshot
  baseAmount      Float    @map("base_amount")
  taxAmount       Float    @map("tax_amount")
  isCompound      Boolean  @default(false)
  
  // Legal Protection
  snapshotDate    DateTime @default(now()) @map("snapshot_date")
  
  invoice         Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  @@index([invoiceId])
  @@map("invoice_tax_snapshots")
}

// Update Invoice model
model Invoice {
  // ... existing ...
  taxSnapshots    InvoiceTaxSnapshot[]  // NEW
}
```
**Impact:**
- ✅ New field, old invoices don't have it (ok)
- ✅ New invoices MUST create snapshots
- ⚠️ Requires invoice creation logic update
- ✅ No retroactive changes

#### Phase 3: Enhanced Finance Settings (SAFE ADDITION)
```prisma
// Extend FinanceSettings (line 1896)
model FinanceSettings {
  // ... existing fields ...
  
  // Multi-Currency Support
  supportedCurrencies String[]  @default(["USD"])  // NEW
  
  // Invoice Numbering
  invoiceSequence     Int      @default(1) @map("invoice_sequence")  // NEW
  receiptSequence     Int      @default(1) @map("receipt_sequence")  // NEW
  
  // Tax Behavior
  autoApplyTax        Boolean  @default(true) @map("auto_apply_tax")  // NEW
  taxCalculationMode  String   @default("inclusive") // "inclusive" | "exclusive"  // NEW
  
  // Feature Flags
  allowTaxOverride    Boolean  @default(false) @map("allow_tax_override")  // NEW
  requireApproval     Boolean  @default(false) @map("require_approval")  // NEW
  
  // ... rest of fields ...
}
```
**Impact:**
- ✅ All new fields have defaults
- ✅ Existing tenants get safe defaults
- ✅ No breaking changes

---

## 🔧 BACKEND IMPACT ANALYSIS

### APIs Affected

#### 1. Invoice Creation API
**Current Location:** `/api/invoices` or similar

**Changes Required:**
```typescript
// BEFORE (v1 - keep as-is)
async function createInvoice(data) {
  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      number: generateNumber(),
      ...data,
      items: {
        create: data.items
      }
    }
  })
  return invoice
}

// AFTER (v2 - add alongside)
async function createInvoiceV2(data, tenant) {
  // 1. Check tenant finance mode
  const mode = tenant.financeMode || 'legacy'
  
  if (mode === 'legacy') {
    return createInvoice(data)  // Use old function
  }
  
  // 2. Get applicable taxes
  const taxes = await getTenantTaxes(tenant.id)
  
  // 3. Calculate with snapshots
  const { items, snapshots } = calculateWithSnapshots(data.items, taxes)
  
  // 4. Create invoice with snapshots
  const invoice = await prisma.invoice.create({
    data: {
      ...data,
      financeVersion: 'v2',
      items: { create: items },
      taxSnapshots: { create: snapshots }  // NEW
    }
  })
  
  return invoice
}
```

**Impact:**
- ✅ Old API calls still work
- ✅ New function for new tenants
- ⚠️ Must add tax snapshot logic
- ⚠️ Must add tenant mode check

#### 2. Tax Management APIs
**New APIs Needed:**

```typescript
// GET /api/tenants/:id/taxes
// - List tenant's tax configurations
// - Returns global templates + custom taxes

// POST /api/tenants/:id/taxes
// - Create custom tenant tax
// - Only if tenant.financeMode = 'tenant'

// PATCH /api/tenants/:id/taxes/:taxId
// - Update tenant tax rate
// - Creates new version with effective date
// - Does NOT affect existing invoices

// DELETE /api/tenants/:id/taxes/:taxId
// - Soft delete (can't delete if used in invoices)
```

**Impact:**
- ✅ All new endpoints
- ✅ No changes to existing endpoints
- ✅ Protected by finance mode check

#### 3. Invoice Calculation Logic
**Current:** Likely in service/utils
**Required Changes:**

```typescript
// BEFORE
function calculateInvoice(items, taxRate) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const tax = subtotal * (taxRate / 100)
  return { subtotal, tax, total: subtotal + tax }
}

// AFTER - Keep old, add new
function calculateInvoiceV2(items, taxStructures, mode = 'exclusive') {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  
  const snapshots = []
  let totalTax = 0
  
  for (const tax of taxStructures) {
    const taxAmount = calculateTax(subtotal, tax, mode)
    snapshots.push({
      taxId: tax.id,
      taxSource: tax.globalTemplateId ? 'GLOBAL_TEMPLATE' : 'TENANT_CUSTOM',
      taxName: tax.name,
      taxType: tax.taxType || 'CUSTOM',
      taxRate: tax.rate,
      baseAmount: subtotal,
      taxAmount,
      isCompound: tax.isCompound || false
    })
    totalTax += taxAmount
  }
  
  return {
    subtotal,
    taxTotal: totalTax,
    grandTotal: subtotal + totalTax,
    snapshots
  }
}
```

**Impact:**
- ✅ Old function still exists
- ✅ New function for v2
- ⚠️ Must create snapshot objects
- ⚠️ Must handle multiple taxes

---

## 🎨 FRONTEND IMPACT ANALYSIS

### Components Affected

#### 1. Invoice Creation Form
**Location:** Likely `/components/invoices/CreateInvoice.tsx`

**Changes Required:**
```tsx
// BEFORE - Single tax rate dropdown
<Select name="taxRate">
  <option value="0">No Tax</option>
  <option value="18">GST 18%</option>
</Select>

// AFTER - Tax selection based on tenant mode
{tenant.financeMode === 'legacy' ? (
  <Select name="taxRate">
    <option value="0">No Tax</option>
    <option value="18">GST 18%</option>
  </Select>
) : (
  <MultiSelect name="taxes">
    {taxStructures.map(tax => (
      <option key={tax.id} value={tax.id}>
        {tax.name} ({tax.rate}%)
      </option>
    ))}
  </MultiSelect>
)}
```

**Impact:**
- ⚠️ UI changes based on tenant mode
- ✅ Old UI still works for legacy mode
- ⚠️ Must fetch tax structures for new mode

#### 2. Tax Settings Page
**New Page Required:** `/app/(admin)/admin/finance/taxes/page.tsx`

**Features:**
```tsx
export default function TaxSettingsPage() {
  const { tenant } = useTenant()
  
  // Show read-only if legacy mode
  if (tenant.financeMode === 'legacy') {
    return <LegacyTaxView />
  }
  
  // Show editable if tenant mode
  return (
    <div>
      <h1>Tax Configuration</h1>
      
      {/* Global Templates */}
      <section>
        <h2>Available Global Templates</h2>
        {globalTemplates.map(template => (
          <TaxTemplateCard 
            template={template}
            onAdopt={() => adoptTemplate(template.id)}
          />
        ))}
      </section>
      
      {/* Custom Taxes */}
      <section>
        <h2>Custom Tax Configurations</h2>
        <Button onClick={createCustomTax}>+ Add Custom Tax</Button>
        {customTaxes.map(tax => (
          <TaxConfigCard
            tax={tax}
            onEdit={() => editTax(tax.id)}
            onDelete={() => deleteTax(tax.id)}
          />
        ))}
      </section>
    </div>
  )
}
```

**Impact:**
- ✅ Completely new page
- ✅ No changes to existing pages
- ⚠️ Must check tenant mode everywhere

#### 3. Finance Settings Page
**Update Required:** Add "Finance Mode" toggle

```tsx
// In /app/(admin)/admin/finance/settings/page.tsx

<FormSection title="Finance System">
  <Select
    name="financeMode"
    value={settings.financeMode}
    onChange={handleModeChange}
    disabled={!canChangefinanceMode()}  // Only if no active invoices
  >
    <option value="legacy">Legacy (Super Admin Tax)</option>
    <option value="tenant">Advanced (Tenant-Owned Tax)</option>
  </Select>
  
  {settings.financeMode === 'tenant' && (
    <Alert>
      <InfoIcon />
      <p>You now have full control over tax configuration.</p>
      <Link href="/admin/finance/taxes">Configure Taxes →</Link>
    </Alert>
  )}
</FormSection>
```

**Impact:**
- ⚠️ Add mode selector to existing page
- ⚠️ Show warning before switching modes
- ✅ Doesn't break existing functionality

---

## 🚀 STEP-BY-STEP IMPLEMENTATION PLAN

### PHASE 0: Foundation (Week 1) - ZERO RISK
**Goal:** Add version tracking without changing behavior

**Database:**
```bash
# Add migration: add_finance_version.sql
ALTER TABLE invoices 
ADD COLUMN finance_version VARCHAR(10) DEFAULT 'v1';

ALTER TABLE tenants
ADD COLUMN finance_mode VARCHAR(20) DEFAULT 'legacy';
```

**No Code Changes Needed**
- ✅ All existing invoices = v1
- ✅ All tenants = legacy
- ✅ System functions exactly the same

**Testing:**
- [x] Create new invoice → should have finance_version = 'v1'
- [x] Check all tenants → should have finance_mode = 'legacy'
- [x] Verify existing invoices → all calculations still work

---

### PHASE 1: Tax Snapshot Protection (Week 2) - LOW RISK
**Goal:** Protect invoices from future tax changes

**Database:**
```sql
-- Create invoice_tax_snapshots table
CREATE TABLE invoice_tax_snapshots (
  id VARCHAR PRIMARY KEY,
  invoice_id VARCHAR NOT NULL,
  line_item_id VARCHAR,
  tax_id VARCHAR,
  tax_source VARCHAR NOT NULL,
  tax_name VARCHAR NOT NULL,
  tax_type VARCHAR NOT NULL,
  tax_rate FLOAT NOT NULL,
  base_amount FLOAT NOT NULL,
  tax_amount FLOAT NOT NULL,
  is_compound BOOLEAN DEFAULT false,
  snapshot_date TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_tax_snapshots_invoice ON invoice_tax_snapshots(invoice_id);
```

**Backend:** Create snapshot service
```typescript
// /lib/services/tax-snapshot.service.ts
export class TaxSnapshotService {
  static async createSnapshot(invoiceId: string, lineItems: any[], taxes: any[]) {
    const snapshots = []
    
    for (const item of lineItems) {
      for (const tax of taxes) {
        const snapshot = {
          invoiceId,
          lineItemId: item.id,
          taxId: tax.id,
          taxSource: tax.globalTemplateId ? 'GLOBAL_TEMPLATE' : 'TENANT_CUSTOM',
          taxName: tax.name,
          taxType: tax.taxType || 'CUSTOM',
          taxRate: tax.rate,
          baseAmount: item.total,
          taxAmount: (item.total * tax.rate) / 100,
          isCompound: tax.isCompound || false
        }
        snapshots.push(snapshot)
      }
    }
    
    await prisma.invoiceTaxSnapshot.createMany({ data: snapshots })
    return snapshots
  }
}
```

**Update Invoice Creation:**
```typescript
// In /app/api/invoices/route.ts
export async function POST(req: Request) {
  // ... existing code ...
  
  const invoice = await prisma.invoice.create({ data: invoiceData })
  
  // NEW: Create tax snapshots for all invoices (both v1 and v2)
  if (invoice.taxTotal > 0) {
    await TaxSnapshotService.createSnapshot(
      invoice.id,
      invoiceData.items,
      applicableTaxes
    )
  }
  
  return invoice
}
```

**Impact:**
- ✅ New invoices get snapshots
- ✅ Old invoices continue working (no snapshots is ok)
- ⚠️ Must update invoice creation API
- ✅ No frontend changes needed

**Testing:**
- [x] Create invoice with tax → verify snapshots created
- [x] Update tax rate → verify old invoices unchanged
- [x] Old invoices without snapshots → still render correctly

---

### PHASE 2: Tenant Tax Management (Week 3-4) - MEDIUM RISK
**Goal:** Allow tenants to manage their own taxes

**Backend APIs:**
```typescript
// /app/api/tenants/[id]/taxes/route.ts
export async function GET(req: Request, { params }) {
  const tenantId = params.id
  
  // Get tenant's finance mode
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { financeSettings: true }
  })
  
  if (tenant.financeMode === 'legacy') {
    // Return global templates only (read-only)
    const templates = await prisma.globalTaxTemplate.findMany({
      where: { isActive: true }
    })
    return Response.json({ taxes: templates, mode: 'legacy', editable: false })
  }
  
  // Return tenant's tax structures
  const taxes = await prisma.taxStructure.findMany({
    where: { tenantId },
    include: { globalTemplate: true }
  })
  
  return Response.json({ taxes, mode: 'tenant', editable: true })
}

export async function POST(req: Request, { params }) {
  const tenantId = params.id
  const body = await req.json()
  
  // Check finance mode
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  
  if (tenant.financeMode !== 'tenant') {
    return Response.json(
      { error: 'Tenant must enable Advanced Finance mode first' },
      { status: 403 }
    )
  }
  
  // Create custom tax
  const tax = await prisma.taxStructure.create({
    data: {
      tenantId,
      name: body.name,
      rate: body.rate,
      description: body.description,
      isCustom: true,
      isDefault: body.isDefault || false
    }
  })
  
  return Response.json({ tax })
}
```

**Frontend:** New Tax Management Page
```tsx
// /app/(admin)/admin/finance/taxes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function TaxManagementPage() {
  const { data: session } = useSession()
  const [taxes, setTaxes] = useState([])
  const [mode, setMode] = useState('legacy')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchTaxes()
  }, [])
  
  async function fetchTaxes() {
    const tenantId = session.user.tenantId
    const res = await fetch(`/api/tenants/${tenantId}/taxes`)
    const data = await res.json()
    setTaxes(data.taxes)
    setMode(data.mode)
    setLoading(false)
  }
  
  if (loading) return <LoadingSpinner />
  
  if (mode === 'legacy') {
    return (
      <div>
        <Alert variant="info">
          <p>Tax management is controlled by Super Admin.</p>
          <p>To enable tenant-owned tax configuration, contact support.</p>
        </Alert>
        
        <h2>Available Tax Templates (Read-Only)</h2>
        {taxes.map(tax => (
          <Card key={tax.id}>
            <h3>{tax.name}</h3>
            <p>Rate: {tax.rate}%</p>
            <p>Type: {tax.taxType}</p>
            <Badge>Global Template</Badge>
          </Card>
        ))}
      </div>
    )
  }
  
  return (
    <div>
      <h1>Tax Configuration</h1>
      <Button onClick={() => setShowCreate(true)}>+ Add Custom Tax</Button>
      
      {taxes.map(tax => (
        <TaxCard
          key={tax.id}
          tax={tax}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
```

**Impact:**
- ✅ New page, doesn't affect existing features
- ⚠️ Must add navigation link
- ⚠️ Must check permissions
- ✅ Legacy tenants see read-only view

**Testing:**
- [x] Legacy tenant → see read-only global templates
- [x] Advanced tenant → can create/edit taxes
- [x] Create custom tax → verify saved correctly
- [x] Try to delete tax used in invoice → should fail

---

### PHASE 3: Finance Mode Migration (Week 5) - HIGH RISK
**Goal:** Enable tenants to switch to Advanced Finance

**Backend: Migration Service**
```typescript
// /lib/services/finance-migration.service.ts
export class FinanceMigrationService {
  static async canMigrate(tenantId: string) {
    // Check if tenant has any active v1 invoices
    const activeV1Invoices = await prisma.invoice.count({
      where: {
        tenantId,
        financeVersion: 'v1',
        status: { not: 'PAID' }
      }
    })
    
    return {
      canMigrate: activeV1Invoices === 0,
      activeInvoices: activeV1Invoices,
      message: activeV1Invoices > 0 
        ? `Cannot migrate: ${activeV1Invoices} active v1 invoices exist` 
        : 'Ready to migrate'
    }
  }
  
  static async migrateToTenantMode(tenantId: string) {
    // 1. Verify can migrate
    const check = await this.canMigrate(tenantId)
    if (!check.canMigrate) {
      throw new Error(check.message)
    }
    
    // 2. Create default tax structures from current settings
    const settings = await prisma.financeSettings.findUnique({
      where: { tenantId }
    })
    
    if (settings.defaultTaxRate > 0) {
      await prisma.taxStructure.create({
        data: {
          tenantId,
          name: `Default Tax (${settings.defaultTaxRate}%)`,
          rate: settings.defaultTaxRate,
          isDefault: true,
          isCustom: true
        }
      })
    }
    
    // 3. Update tenant mode
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { financeMode: 'tenant' }
    })
    
    return { success: true }
  }
}
```

**API Endpoint:**
```typescript
// /app/api/tenants/[id]/finance/migrate/route.ts
export async function POST(req: Request, { params }) {
  try {
    const check = await FinanceMigrationService.canMigrate(params.id)
    
    if (!check.canMigrate) {
      return Response.json({ error: check.message }, { status: 400 })
    }
    
    await FinanceMigrationService.migrateToTenantMode(params.id)
    
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

**Frontend: Migration UI**
```tsx
// /app/(admin)/admin/finance/settings/page.tsx
function FinanceMigrationSection() {
  const [check, setCheck] = useState(null)
  const [migrating, setMigrating] = useState(false)
  
  useEffect(() => {
    checkMigrationStatus()
  }, [])
  
  async function checkMigrationStatus() {
    const res = await fetch(`/api/tenants/${tenantId}/finance/migrate/check`)
    const data = await res.json()
    setCheck(data)
  }
  
  async function handleMigrate() {
    if (!confirm('This will enable Advanced Finance. Continue?')) return
    
    setMigrating(true)
    const res = await fetch(`/api/tenants/${tenantId}/finance/migrate`, {
      method: 'POST'
    })
    
    if (res.ok) {
      toast.success('Migrated to Advanced Finance!')
      window.location.reload()
    } else {
      const error = await res.json()
      toast.error(error.message)
    }
    setMigrating(false)
  }
  
  if (financeMode === 'tenant') {
    return (
      <Alert variant="success">
        <CheckIcon />
        <p>Advanced Finance is enabled</p>
      </Alert>
    )
  }
  
  return (
    <Card>
      <h3>Upgrade to Advanced Finance</h3>
      <p>Get full control over tax configuration and invoice customization.</p>
      
      {check?.canMigrate ? (
        <Button onClick={handleMigrate} disabled={migrating}>
          {migrating ? 'Migrating...' : 'Enable Advanced Finance'}
        </Button>
      ) : (
        <Alert variant="warning">
          <AlertIcon />
          <p>{check?.message}</p>
          <p>Please complete or cancel all pending v1 invoices first.</p>
        </Alert>
      )}
    </Card>
  )
}
```

**Impact:**
- ⚠️ HIGH RISK - Changes tenant behavior
- ⚠️ Must verify no active invoices
- ⚠️ Must migrate default tax settings
- ⚠️ Must show clear warnings
- ✅ Reversible if no v2 invoices created

**Testing:**
- [x] Tenant with active invoices → migration blocked
- [x] Tenant with paid invoices only → migration allowed
- [x] After migration → new invoices use v2
- [x] After migration → old invoices still work

---

### PHASE 4: Enhanced Invoice Features (Week 6-7) - MEDIUM RISK
**Goal:** Add multi-currency, better numbering, approvals

**Database:**
```sql
-- Add to finance_settings
ALTER TABLE finance_settings
ADD COLUMN supported_currencies TEXT[] DEFAULT ARRAY['USD'],
ADD COLUMN invoice_sequence INT DEFAULT 1,
ADD COLUMN receipt_sequence INT DEFAULT 1,
ADD COLUMN auto_apply_tax BOOLEAN DEFAULT true,
ADD COLUMN tax_calculation_mode VARCHAR(20) DEFAULT 'exclusive',
ADD COLUMN allow_tax_override BOOLEAN DEFAULT false,
ADD COLUMN require_approval BOOLEAN DEFAULT false;
```

**Backend: Enhanced Invoice Service**
```typescript
// /lib/services/invoice.service.ts
export class InvoiceService {
  static async createInvoice(data, tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { financeSettings: true }
    })
    
    const version = tenant.financeMode === 'tenant' ? 'v2' : 'v1'
    
    // Generate invoice number
    const number = await this.generateInvoiceNumber(tenantId, tenant.financeSettings)
    
    // Get applicable taxes
    const taxes = version === 'v2' 
      ? await this.getTenantTaxes(tenantId)
      : await this.getGlobalTaxes()
    
    // Calculate with correct method
    const calculation = version === 'v2'
      ? await this.calculateV2(data.items, taxes, tenant.financeSettings)
      : await this.calculateV1(data.items, data.taxRate)
    
    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        number,
        financeVersion: version,
        ...data,
        ...calculation.totals,
        items: { create: calculation.items },
        taxSnapshots: version === 'v2' ? { create: calculation.snapshots } : undefined
      }
    })
    
    return invoice
  }
  
  static async generateInvoiceNumber(tenantId, settings) {
    const sequence = settings.invoiceSequence
    const prefix = settings.invoicePrefix || 'INV'
    const year = new Date().getFullYear()
    
    // Increment sequence
    await prisma.financeSettings.update({
      where: { tenantId },
      data: { invoiceSequence: sequence + 1 }
    })
    
    return `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`
  }
}
```

**Impact:**
- ✅ Better invoice numbering
- ✅ Multi-currency support
- ⚠️ Must update invoice creation flow
- ⚠️ Must update calculation logic

---

## 🛡️ RISK MITIGATION STRATEGIES

### 1. Feature Flags
```typescript
// /lib/feature-flags.ts
export const FEATURE_FLAGS = {
  TENANT_FINANCE: process.env.ENABLE_TENANT_FINANCE === 'true',
  TAX_SNAPSHOTS: process.env.ENABLE_TAX_SNAPSHOTS === 'true',
  FINANCE_MIGRATION: process.env.ENABLE_FINANCE_MIGRATION === 'true'
}

// Use in code:
if (FEATURE_FLAGS.TENANT_FINANCE && tenant.financeMode === 'tenant') {
  // Use v2 logic
} else {
  // Use v1 logic
}
```

### 2. Rollback Plan
```sql
-- Quick rollback if needed
UPDATE tenants SET finance_mode = 'legacy' WHERE finance_mode = 'tenant';
UPDATE invoices SET finance_version = 'v1' WHERE finance_version = 'v2' AND status = 'DRAFT';
```

### 3. Dual-Run Testing
```typescript
// Test both systems in parallel
async function createInvoice(data) {
  const v1Result = await createInvoiceV1(data)
  const v2Result = await createInvoiceV2(data)
  
  // Compare results
  if (Math.abs(v1Result.total - v2Result.total) > 0.01) {
    logger.warn('V1/V2 calculation mismatch', { v1Result, v2Result })
  }
  
  // Return based on flag
  return FEATURE_FLAGS.TENANT_FINANCE ? v2Result : v1Result
}
```

### 4. Data Validation
```typescript
// Before allowing migration
async function validateBeforeMigration(tenantId) {
  const checks = {
    hasFinanceSettings: false,
    hasDefaultTax: false,
    noActiveV1Invoices: false,
    noOverduePayments: false
  }
  
  const settings = await prisma.financeSettings.findUnique({ where: { tenantId } })
  checks.hasFinanceSettings = !!settings
  
  const activeInvoices = await prisma.invoice.count({
    where: { tenantId, financeVersion: 'v1', status: { not: 'PAID' } }
  })
  checks.noActiveV1Invoices = activeInvoices === 0
  
  // ... more checks ...
  
  return checks
}
```

---

## 📋 FINAL IMPLEMENTATION CHECKLIST

### Database
- [ ] Add `finance_version` to Invoice (default 'v1')
- [ ] Add `finance_mode` to Tenant (default 'legacy')
- [ ] Create `InvoiceTaxSnapshot` model
- [ ] Extend `FinanceSettings` with new fields
- [ ] Add indexes for performance
- [ ] Run migration on staging
- [ ] Verify all existing data gets defaults
- [ ] Test rollback script

### Backend
- [ ] Create TaxSnapshotService
- [ ] Create FinanceMigrationService
- [ ] Update invoice creation to support both v1/v2
- [ ] Add tenant tax management APIs
- [ ] Add finance mode migration API
- [ ] Add validation before migration
- [ ] Implement feature flags
- [ ] Add comprehensive logging
- [ ] Write unit tests for v1/v2 calculations
- [ ] Write integration tests

### Frontend
- [ ] Add Tax Management page
- [ ] Update Finance Settings page
- [ ] Add migration UI with warnings
- [ ] Update invoice creation form
- [ ] Add finance mode indicator
- [ ] Show appropriate UI based on mode
- [ ] Add permission checks
- [ ] Update navigation
- [ ] Add user documentation
- [ ] Test all flows in both modes

### Documentation
- [ ] API documentation for new endpoints
- [ ] User guide for tax management
- [ ] Migration guide for tenants
- [ ] Admin guide for super admin
- [ ] Troubleshooting guide
- [ ] Database schema documentation

### Testing
- [ ] Unit tests for tax calculations
- [ ] Integration tests for invoice creation
- [ ] E2E tests for migration flow
- [ ] Performance tests with large data
- [ ] Security tests for permissions
- [ ] Compatibility tests (v1 vs v2)
- [ ] Rollback tests

---

## ⏱️ ESTIMATED TIMELINE

- **Phase 0:** 1 week (Version tagging)
- **Phase 1:** 2 weeks (Tax snapshots)  
- **Phase 2:** 2 weeks (Tenant tax management)
- **Phase 3:** 2 weeks (Migration flows)
- **Phase 4:** 2 weeks (Enhanced features)
- **Testing/Polish:** 2 weeks

**Total: 11 weeks (3 months) for full implementation**

---

## 🎯 SUCCESS CRITERIA

✅ All existing invoices work unchanged
✅ No retroactive tax recalculations
✅ Tenants can opt-in to new system
✅ Old invoices render correctly after migration
✅ Tax changes don't affect historical invoices
✅ Clear rollback path exists
✅ Super admin can't edit tenant taxes
✅ Comprehensive audit trail exists
✅ Performance remains stable

---

## ⚠️ CRITICAL DON'TS

❌ Never modify existing invoice calculations
❌ Never recalculate tax on existing invoices
❌ Never force tenants to migrate
❌ Never delete old tax data
❌ Never allow super admin to edit tenant tax rates
❌ Never change invoice numbers after creation
❌ Never skip tax snapshot creation
❌ Never allow migration with active invoices

---

## CONCLUSION

This migration can be done **SAFELY** because:

1. **Database already supports multi-tenancy** - tenantId exists everywhere
2. **Tax system exists** - GlobalTaxTemplate and TaxStructure ready
3. **Version field** prevents mixing v1/v2 logic
4. **Snapshots** protect historical data
5. **Feature flags** allow gradual rollout
6. **Dual mode** means both systems coexist
7. **Migration is opt-in** - tenants choose when ready

The key is **incremental rollout** with **no breaking changes** to existing functionality.
