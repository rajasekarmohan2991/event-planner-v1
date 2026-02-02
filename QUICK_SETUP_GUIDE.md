# Quick Setup Guide - Tax & Convenience Fee System

## 🚀 For Super Admin - Initial Setup

### **Step 1: Configure Tax Structures for All Countries**

Tax structures are **automatically created** when a company is registered based on their country. The system supports 15+ countries with accurate tax rates.

**Already Working:**
- When a company is created with `country = 'IN'`, the system auto-creates:
  - GST 18% (default)
  - GST 12%
  - GST 5%
  - GST 0%

**Supported Countries:**
- 🇮🇳 India (GST 18%, 12%, 5%, 0%)
- 🇺🇸 USA (Sales Tax 7.5%)
- 🇬🇧 UK (VAT 20%, 5%, 0%)
- 🇨🇦 Canada (GST/HST 5%, 13%, 15%)
- 🇦🇺 Australia (GST 10%)
- 🇪🇺 EU (VAT 20%, 10%, 5%)
- 🇩🇪 Germany (MwSt 19%, 7%)
- 🇫🇷 France (TVA 20%, 10%, 5.5%, 2.1%)
- 🇸🇬 Singapore (GST 8%)
- 🇦🇪 UAE (VAT 5%)
- 🇯🇵 Japan (10%, 8%)
- 🇨🇳 China (VAT 13%, 9%, 6%)
- 🇧🇷 Brazil (ICMS 18%, ISS 5%)
- 🇲🇽 Mexico (IVA 16%)
- 🇿🇦 South Africa (VAT 15%)
- 🇳🇿 New Zealand (GST 15%)

**View/Edit Tax Structures:**
```
URL: /super-admin/companies/[company-id]/tax-structures
```

---

### **Step 2: Configure Convenience Fees for Companies**

Set up platform/processing fees that can be passed to customers or absorbed by the organizer.

**API Endpoint:**
```bash
POST /api/super-admin/companies/[company-id]/convenience-fees
```

**Example 1: Hybrid Fee (Percentage + Fixed)**
```json
{
  "feeType": "HYBRID",
  "percentageFee": 2.5,
  "fixedFee": 10,
  "appliesTo": "ALL",
  "passFeeToCustomer": true,
  "displayName": "Platform Fee",
  "description": "Platform processing and service fee"
}
```

**Example 2: Percentage Only**
```json
{
  "feeType": "PERCENTAGE",
  "percentageFee": 3.0,
  "appliesTo": "TICKET",
  "passFeeToCustomer": true,
  "displayName": "Booking Fee",
  "description": "Online booking convenience fee"
}
```

**Example 3: Fixed Fee Only**
```json
{
  "feeType": "FIXED",
  "fixedFee": 50,
  "appliesTo": "ALL",
  "passFeeToCustomer": false,
  "displayName": "Service Fee",
  "description": "Organizer absorbs this fee"
}
```

**Using cURL:**
```bash
# India Company - Hybrid Fee
curl -X POST https://your-domain.com/api/super-admin/companies/company_india_123/convenience-fees \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "feeType": "HYBRID",
    "percentageFee": 2.5,
    "fixedFee": 10,
    "appliesTo": "ALL",
    "passFeeToCustomer": true,
    "displayName": "Platform Fee"
  }'

# USA Company - Percentage Fee
curl -X POST https://your-domain.com/api/super-admin/companies/company_usa_456/convenience-fees \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "feeType": "PERCENTAGE",
    "percentageFee": 2.9,
    "appliesTo": "TICKET",
    "passFeeToCustomer": true,
    "displayName": "Processing Fee"
  }'
```

**Using Direct Database Insert:**
```sql
-- India Company: 2.5% + ₹10
INSERT INTO convenience_fee_config (
    id, tenant_id, fee_type, percentage_fee, fixed_fee,
    applies_to, pass_fee_to_customer, display_name, description
) VALUES (
    'fee_' || gen_random_uuid(),
    'company_india_123',
    'HYBRID',
    2.5,
    10,
    'ALL',
    true,
    'Platform Fee',
    'Platform processing and service fee'
);

-- USA Company: 2.9% only
INSERT INTO convenience_fee_config (
    id, tenant_id, fee_type, percentage_fee, fixed_fee,
    applies_to, pass_fee_to_customer, display_name
) VALUES (
    'fee_' || gen_random_uuid(),
    'company_usa_456',
    'PERCENTAGE',
    2.9,
    0,
    'TICKET',
    true,
    'Processing Fee'
);
```

---

### **Step 3: Verify Configuration**

**Check Tax Structures:**
```bash
GET /api/super-admin/companies/[company-id]/tax-structures
```

**Check Convenience Fees:**
```bash
GET /api/super-admin/companies/[company-id]/convenience-fees
```

---

## 🏢 For Company Admins - Event-Level Overrides

### **Override Tax for Specific Event**

**Use Case:** Charity event with tax exemption

```bash
POST /api/events/[event-id]/tax-settings
```

```json
{
  "isTaxExempt": true,
  "exemptionReason": "Registered charity fundraiser",
  "exemptionCertificateUrl": "https://cloudinary.com/cert.pdf"
}
```

### **Override Convenience Fee for Specific Event**

**Use Case:** Promotional event with reduced fees

```bash
POST /api/events/[event-id]/convenience-fees
```

```json
{
  "feeType": "PERCENTAGE",
  "percentageFee": 1.0,
  "appliesTo": "TICKET",
  "passFeeToCustomer": true,
  "displayName": "Promotional Booking Fee"
}
```

---

## 💰 How Pricing Works

### **Complete Pricing Flow**

```
1. Base Ticket Price: ₹1,000
   ↓
2. Apply Promo Code (if any): -₹100
   = Price After Discount: ₹900
   ↓
3. Calculate Tax (GST 18%): +₹162
   = Subtotal with Tax: ₹1,062
   ↓
4. Calculate Convenience Fee (2.5% + ₹10): +₹36.55
   = Final Amount: ₹1,098.55
```

### **Pricing Breakdown Shown to Customer**

```
Ticket Price:        ₹1,000.00
Discount (PROMO10):  -₹100.00
                     ----------
Subtotal:            ₹900.00
GST (18%):           ₹162.00
Platform Fee:        ₹36.55
                     ----------
Total to Pay:        ₹1,098.55
```

---

## 🔧 Configuration Options

### **Fee Types**

| Type | Description | Example |
|------|-------------|---------|
| **PERCENTAGE** | % of transaction | 2.5% of ₹1,000 = ₹25 |
| **FIXED** | Flat amount | ₹50 per transaction |
| **HYBRID** | Both combined | 2.5% + ₹10 |

### **Applies To**

| Value | Description |
|-------|-------------|
| **ALL** | All transaction types |
| **TICKET** | Only ticket sales |
| **SPONSOR** | Only sponsorships |
| **EXHIBITOR** | Only exhibitor bookings |

### **Pass Fee To Customer**

| Value | Description |
|-------|-------------|
| **true** | Customer pays the fee (added to total) |
| **false** | Organizer absorbs the fee (deducted from revenue) |

### **Min/Max Limits**

```json
{
  "minimumFee": 10,    // Fee will be at least ₹10
  "maximumFee": 500    // Fee will not exceed ₹500
}
```

---

## 📊 Real-World Examples

### **Example 1: India Tech Conference**

**Company Setup:**
- Country: India
- Tax: GST 18% (auto-created)
- Convenience Fee: 2.5% + ₹10

**Ticket Sale:**
```
Ticket: ₹5,000
GST 18%: ₹900
Subtotal: ₹5,900
Convenience Fee (2.5% of ₹5,900 + ₹10): ₹157.50
Total: ₹6,057.50
```

### **Example 2: USA Music Festival**

**Company Setup:**
- Country: USA
- Tax: Sales Tax 7.5%
- Convenience Fee: 2.9%

**Ticket Sale:**
```
Ticket: $100
Sales Tax 7.5%: $7.50
Subtotal: $107.50
Convenience Fee (2.9% of $107.50): $3.12
Total: $110.62
```

### **Example 3: UK Charity Event**

**Company Setup:**
- Country: UK
- Tax: VAT 20%
- Convenience Fee: 2%

**Event Override:**
- Tax Exempt: Yes (charity event)

**Ticket Sale:**
```
Ticket: £50
Tax: £0 (exempt)
Subtotal: £50
Convenience Fee (2% of £50): £1.00
Total: £51.00
```

---

## 🚨 Important Notes

### **Tax Configuration**
- ✅ Tax structures are **auto-created** based on company country
- ✅ Super admin can view/edit at `/super-admin/companies/[id]/tax-structures`
- ✅ Each company gets country-specific tax rates automatically
- ✅ Events can override company tax settings if needed

### **Convenience Fees**
- ⚠️ Must be **manually configured** per company (no auto-creation)
- ✅ Use API endpoints or direct database insert
- ✅ Events can override company default fees
- ✅ Fees can be passed to customer or absorbed by organizer

### **Event Registration**
- ✅ Automatically calculates: Base + Discount + Tax + Convenience Fee
- ✅ Detailed pricing breakdown logged in console
- ✅ Fallback to simple calculation if pricing service fails
- ✅ Works with existing promo code system

---

## 🔗 API Reference

### **Tax Configuration**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/super-admin/companies/[id]/tax-structures` | GET | List company tax structures |
| `/api/super-admin/companies/[id]/tax-structures` | POST | Create tax structure |
| `/api/events/[id]/tax-settings` | GET | Get event tax settings |
| `/api/events/[id]/tax-settings` | POST | Override event tax |
| `/api/events/[id]/tax-settings` | DELETE | Reset to company default |

### **Convenience Fees**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/super-admin/companies/[id]/convenience-fees` | GET | Get company fee config |
| `/api/super-admin/companies/[id]/convenience-fees` | POST | Create/update fee config |
| `/api/super-admin/companies/[id]/convenience-fees` | DELETE | Remove fee config |
| `/api/events/[id]/convenience-fees` | GET | Get event fee config |
| `/api/events/[id]/convenience-fees` | POST | Override event fee |
| `/api/events/[id]/convenience-fees` | DELETE | Reset to company default |

---

## ✅ Deployment Checklist

- [x] Tax calculator service implemented
- [x] Convenience fee calculator implemented
- [x] Event registration integrated with pricing
- [x] Database schema auto-healing enabled
- [x] API endpoints created and tested
- [x] Build successful
- [x] Code pushed to GitHub
- [ ] Configure convenience fees for each company
- [ ] Test complete registration flow in production
- [ ] Verify pricing calculations
- [ ] Monitor for any errors

---

## 🎯 Next Steps

1. **Deploy to Production** (Vercel/Render/Supabase)
   - Code is already pushed to GitHub
   - Vercel will auto-deploy frontend
   - Database schema will auto-heal on first API call

2. **Configure Convenience Fees**
   - Use API endpoints or direct SQL
   - Set up fees for each company
   - Test with sample transactions

3. **Monitor & Verify**
   - Check event registration logs
   - Verify pricing calculations
   - Ensure tax and fees are correct

---

**System Status**: ✅ Production Ready  
**Deployment**: Ready for Vercel/Render/Supabase  
**Last Updated**: January 13, 2026
