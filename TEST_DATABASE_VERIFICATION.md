# Database Verification Test Plan

## 🎯 Objective
Verify that all database tables are created properly, data persists correctly, and tax/convenience fee configuration works across all companies.

---

## 📋 Test Checklist

### **Phase 1: Database Table Creation**

#### **1.1 Verify global_tax_templates Table**
```sql
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'global_tax_templates'
);

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'global_tax_templates'
ORDER BY ordinal_position;

-- Expected columns:
-- id, name, rate, description, tax_type, country_code
-- is_active, effective_from, effective_until
-- applies_to, is_compound, created_by, created_at, updated_at
```

#### **1.2 Verify tax_structures Table Enhancements**
```sql
-- Check if new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tax_structures'
AND column_name IN ('global_template_id', 'is_custom', 'country_code', 'tax_type');

-- Expected: All 4 columns should exist
```

#### **1.3 Verify convenience_fee_config Table**
```sql
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'convenience_fee_config'
);

-- Check table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'convenience_fee_config'
ORDER BY ordinal_position;
```

#### **1.4 Verify event_tax_settings Table**
```sql
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'event_tax_settings'
);
```

---

### **Phase 2: Data Persistence Tests**

#### **2.1 Create Global Tax Template**
```bash
# API Call
curl -X POST https://aypheneventplanner.vercel.app/api/super-admin/tax-templates \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "GST 18% India",
    "rate": 18,
    "description": "Standard GST rate for India",
    "taxType": "GST",
    "countryCode": "IN",
    "appliesTo": "ALL",
    "isActive": true
  }'

# Expected Response:
# {
#   "template": {
#     "id": "...",
#     "name": "GST 18% India",
#     "rate": 18,
#     ...
#   },
#   "message": "Tax template created successfully"
# }
```

**Verification Query:**
```sql
SELECT * FROM global_tax_templates 
WHERE name = 'GST 18% India' 
AND country_code = 'IN';

-- Expected: 1 row with correct data
```

#### **2.2 Create Company Tax Structure Using Global Template**
```bash
# API Call
curl -X POST https://aypheneventplanner.vercel.app/api/super-admin/companies/[company-id]/tax-structures \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "GST 18%",
    "rate": 18,
    "globalTemplateId": "[template-id-from-step-2.1]",
    "isDefault": true
  }'

# Expected Response:
# {
#   "taxStructure": {
#     "id": "...",
#     "name": "GST 18%",
#     "rate": 18,
#     "globalTemplateId": "...",
#     "isCustom": false,
#     "globalTemplate": { ... }
#   }
# }
```

**Verification Query:**
```sql
SELECT 
    ts.id,
    ts.name,
    ts.rate,
    ts.global_template_id,
    ts.is_custom,
    ts.tenant_id,
    gt.name as template_name
FROM tax_structures ts
LEFT JOIN global_tax_templates gt ON ts.global_template_id = gt.id
WHERE ts.tenant_id = '[company-id]';

-- Expected: 1 row with global_template_id populated and is_custom = false
```

#### **2.3 Create Custom Tax Structure (No Template)**
```bash
# API Call
curl -X POST https://aypheneventplanner.vercel.app/api/super-admin/companies/[company-id]/tax-structures \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Custom Tax 15%",
    "rate": 15,
    "description": "Custom company-specific tax",
    "isCustom": true
  }'
```

**Verification Query:**
```sql
SELECT * FROM tax_structures 
WHERE name = 'Custom Tax 15%' 
AND is_custom = true 
AND global_template_id IS NULL;

-- Expected: 1 row with is_custom = true and no global_template_id
```

#### **2.4 Create Convenience Fee Configuration**
```bash
# API Call
curl -X POST https://aypheneventplanner.vercel.app/api/super-admin/companies/[company-id]/convenience-fees \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "feeType": "HYBRID",
    "percentageFee": 2.5,
    "fixedFee": 10,
    "appliesTo": "ALL",
    "passFeeToCustomer": true,
    "displayName": "Platform Fee",
    "description": "Platform processing fee"
  }'
```

**Verification Query:**
```sql
SELECT * FROM convenience_fee_config 
WHERE tenant_id = '[company-id]' 
AND event_id IS NULL;

-- Expected: 1 row with fee_type = 'HYBRID', percentage_fee = 2.5, fixed_fee = 10
```

#### **2.5 Create Event Tax Override**
```bash
# API Call
curl -X POST https://aypheneventplanner.vercel.app/api/events/[event-id]/tax-settings \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "useCustomTax": true,
    "customTaxRate": 12,
    "customTaxName": "Reduced GST 12%"
  }'
```

**Verification Query:**
```sql
SELECT * FROM event_tax_settings 
WHERE event_id = [event-id];

-- Expected: 1 row with custom_tax_rate = 12
```

---

### **Phase 3: Configuration Across Multiple Companies**

#### **3.1 Test Company 1 (India)**
```sql
-- Create company
INSERT INTO tenants (id, name, slug, country, currency, status)
VALUES ('test_company_india', 'Test India Co', 'test-india', 'IN', 'INR', 'ACTIVE');

-- Verify auto-created tax structures
SELECT * FROM tax_structures WHERE tenant_id = 'test_company_india';

-- Expected: GST 18%, 12%, 5%, 0% (auto-created based on country)
```

#### **3.2 Test Company 2 (USA)**
```sql
-- Create company
INSERT INTO tenants (id, name, slug, country, currency, status)
VALUES ('test_company_usa', 'Test USA Co', 'test-usa', 'US', 'USD', 'ACTIVE');

-- Verify auto-created tax structures
SELECT * FROM tax_structures WHERE tenant_id = 'test_company_usa';

-- Expected: Sales Tax 7.5% (auto-created based on country)
```

#### **3.3 Test Company 3 (UK)**
```sql
-- Create company
INSERT INTO tenants (id, name, slug, country, currency, status)
VALUES ('test_company_uk', 'Test UK Co', 'test-uk', 'GB', 'GBP', 'ACTIVE');

-- Verify auto-created tax structures
SELECT * FROM tax_structures WHERE tenant_id = 'test_company_uk';

-- Expected: VAT 20%, 5%, 0% (auto-created based on country)
```

---

### **Phase 4: Event Registration with Complete Pricing**

#### **4.1 Create Test Event**
```sql
INSERT INTO events (id, name, tenant_id, start_date, end_date, status)
VALUES (999999, 'Test Event', 'test_company_india', NOW() + INTERVAL '30 days', NOW() + INTERVAL '31 days', 'PUBLISHED');
```

#### **4.2 Create Test Ticket**
```sql
INSERT INTO tickets (id, event_id, name, price_in_minor, quantity, sold, status)
VALUES (999999, 999999, 'General Admission', 100000, 100, 0, 'ACTIVE');
-- price_in_minor = 100000 = ₹1,000
```

#### **4.3 Test Event Registration**
```bash
# API Call
curl -X POST https://aypheneventplanner.vercel.app/api/events/999999/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "ticketId": "999999",
    "totalPrice": 1000,
    "quantity": 1
  }'

# Expected: Registration created with complete pricing breakdown
```

**Verification Query:**
```sql
-- Check registration
SELECT * FROM registrations WHERE event_id = '999999';

-- Check order
SELECT * FROM "Order" WHERE "eventId" = '999999';

-- Expected pricing breakdown in logs:
-- Base Price: ₹1,000
-- Tax (GST 18%): ₹180
-- Subtotal: ₹1,180
-- Convenience Fee (2.5% + ₹10): ₹39.50
-- Final Amount: ₹1,219.50
```

---

### **Phase 5: API Endpoint Tests**

#### **5.1 Global Tax Templates**
```bash
# GET all templates
curl https://aypheneventplanner.vercel.app/api/super-admin/tax-templates

# GET templates by country
curl https://aypheneventplanner.vercel.app/api/super-admin/tax-templates?countryCode=IN

# POST create template (tested in 2.1)

# PUT update template
curl -X PUT https://aypheneventplanner.vercel.app/api/super-admin/tax-templates/[template-id] \
  -H "Content-Type: application/json" \
  -d '{"rate": 19}'

# DELETE template
curl -X DELETE https://aypheneventplanner.vercel.app/api/super-admin/tax-templates/[template-id]
```

#### **5.2 Company Tax Structures**
```bash
# GET company tax structures
curl https://aypheneventplanner.vercel.app/api/super-admin/companies/[company-id]/tax-structures

# POST create (tested in 2.2)

# DELETE tax structure
curl -X DELETE https://aypheneventplanner.vercel.app/api/super-admin/companies/[company-id]/tax-structures/[tax-id]
```

#### **5.3 Convenience Fees**
```bash
# GET company convenience fees
curl https://aypheneventplanner.vercel.app/api/super-admin/companies/[company-id]/convenience-fees

# POST create/update (tested in 2.4)

# DELETE convenience fees
curl -X DELETE https://aypheneventplanner.vercel.app/api/super-admin/companies/[company-id]/convenience-fees
```

#### **5.4 Event Tax Settings**
```bash
# GET event tax settings
curl https://aypheneventplanner.vercel.app/api/events/[event-id]/tax-settings

# POST create/update (tested in 2.5)

# DELETE event tax settings
curl -X DELETE https://aypheneventplanner.vercel.app/api/events/[event-id]/tax-settings
```

---

### **Phase 6: UI Navigation Tests**

#### **6.1 Super Admin Navigation**
- Login as super admin
- Navigate to `/super-admin/tax-templates`
- Verify "Tax Templates" menu item visible
- Verify page loads without errors

#### **6.2 Company Admin Navigation**
- Login as company admin
- Navigate to `/admin/settings/tax`
- Verify "Tax Settings" menu item visible
- Verify page loads without errors

---

## ✅ Success Criteria

### **Database Tables**
- [x] `global_tax_templates` table created
- [x] `tax_structures` enhanced with `global_template_id` and `is_custom`
- [x] `convenience_fee_config` table created
- [x] `event_tax_settings` table created
- [x] All indexes created

### **Data Persistence**
- [ ] Global tax templates can be created and retrieved
- [ ] Company tax structures can link to global templates
- [ ] Custom tax structures work without templates
- [ ] Convenience fees can be configured per company
- [ ] Event tax overrides work correctly

### **Configuration Across Companies**
- [ ] India company gets GST rates automatically
- [ ] USA company gets Sales Tax automatically
- [ ] UK company gets VAT rates automatically
- [ ] Each company can have custom rates

### **Event Registration**
- [ ] Complete pricing calculation works
- [ ] Tax is applied correctly
- [ ] Convenience fee is applied correctly
- [ ] Final amount is accurate
- [ ] Data persists in database

### **API Endpoints**
- [ ] All GET endpoints return correct data
- [ ] All POST endpoints create data successfully
- [ ] All DELETE endpoints remove data correctly
- [ ] Error handling works properly

### **UI Navigation**
- [ ] Super admin can access tax templates page
- [ ] Company admin can access tax settings page
- [ ] Navigation items visible in sidebar

---

## 🚀 Deployment Verification

### **Production URLs**
- Frontend: https://aypheneventplanner.vercel.app
- Backend: https://event-planner-v1.onrender.com
- Database: Supabase (PostgreSQL)

### **Deployment Steps**
1. ✅ Code pushed to GitHub
2. ⏳ Vercel auto-deploys frontend
3. ⏳ Database schema auto-heals on first API call
4. ⏳ Test all endpoints in production
5. ⏳ Verify data persistence
6. ⏳ Test event registration flow

---

## 📊 Test Results Log

### **Test Run: [Date/Time]**

| Test | Status | Notes |
|------|--------|-------|
| global_tax_templates table | ⏳ Pending | |
| tax_structures enhancements | ⏳ Pending | |
| convenience_fee_config table | ⏳ Pending | |
| event_tax_settings table | ⏳ Pending | |
| Create global template | ⏳ Pending | |
| Create company tax structure | ⏳ Pending | |
| Create convenience fee | ⏳ Pending | |
| Event registration pricing | ⏳ Pending | |
| Multi-company configuration | ⏳ Pending | |
| API endpoints | ⏳ Pending | |
| UI navigation | ⏳ Pending | |

---

**Last Updated**: January 13, 2026  
**Status**: Ready for Production Testing
