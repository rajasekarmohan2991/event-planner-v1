# Finance & Tax Workflow Guide
## Event Planner Platform - Complete Scenario

---

## 🎯 Overview

The Event Planner platform has a comprehensive finance and tax system that handles:
- Multi-currency support
- Flexible tax calculations (inclusive/exclusive)
- Global and company-specific tax templates
- Invoice generation with tax breakdowns
- Payment tracking and reconciliation

---

## 📋 System Architecture

### **Three-Tier Tax System**

```
┌─────────────────────────────────────────┐
│   SUPER ADMIN (Platform Level)         │
│   - Creates Global Tax Templates       │
│   - Sets default tax rates              │
│   - Manages tax compliance rules        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   COMPANY ADMIN (Tenant Level)         │
│   - Inherits or customizes taxes       │
│   - Sets company tax preferences        │
│   - Configures invoice settings         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   EVENT LEVEL                           │
│   - Applies taxes to registrations      │
│   - Generates invoices                  │
│   - Processes payments                  │
└─────────────────────────────────────────┘
```

---

## 🏢 Scenario 1: Platform Setup (Super Admin)

### **Step 1: Super Admin Creates Global Tax Templates**

**Location:** `/super-admin/tax-templates`

**Example: Creating GST for India**

```javascript
Tax Template: "India GST"
├── Tax Name: "CGST"
│   ├── Rate: 9%
│   ├── Type: "PERCENTAGE"
│   ├── Scope: "GLOBAL"
│   └── Applies To: "All Indian companies"
│
└── Tax Name: "SGST"
    ├── Rate: 9%
    ├── Type: "PERCENTAGE"
    ├── Scope: "GLOBAL"
    └── Applies To: "All Indian companies"

Total Tax: 18% (CGST 9% + SGST 9%)
```

**Example: Creating Sales Tax for USA**

```javascript
Tax Template: "USA Sales Tax"
├── Tax Name: "State Tax"
│   ├── Rate: 6%
│   ├── Type: "PERCENTAGE"
│   └── Scope: "GLOBAL"
│
└── Tax Name: "Local Tax"
    ├── Rate: 2%
    ├── Type: "PERCENTAGE"
    └── Scope: "GLOBAL"

Total Tax: 8%
```

### **Step 2: Super Admin Sets System-Wide Finance Settings**

**Location:** `/super-admin/settings` → Finance Tab

```yaml
Global Currency: USD
Supported Currencies: [USD, EUR, GBP, INR]
Tax Calculation Mode: EXCLUSIVE (default)
Invoice Prefix: INV-
Receipt Prefix: RCP-
Payment Terms: NET_30
```

---

## 🏪 Scenario 2: Company Setup (Company Admin)

### **Step 1: Company Admin Configures Company Settings**

**Location:** `/admin/settings` → Finance Settings

```yaml
Company: "TechConf Events Pvt Ltd"
Base Currency: INR
Country: India
Tax Registration: GSTIN-29XXXXX
Invoice Sequence: Starting from 1001
Tax Calculation: EXCLUSIVE
```

### **Step 2: Company Admin Reviews Available Taxes**

**Location:** `/admin/tax-settings`

The company can see:
- ✅ **Global Taxes** (inherited from Super Admin)
  - India GST (18%)
  - Can be used but not modified
  
- ➕ **Option to Create Company-Specific Taxes**
  - Service Tax (if applicable)
  - Cess or additional charges

**Example: Company adds Service Charge**

```javascript
Tax Template: "Service Charge"
├── Tax Name: "Platform Fee"
│   ├── Rate: 5%
│   ├── Type: "PERCENTAGE"
│   └── Scope: "COMPANY_SPECIFIC"
│
└── Applies To: "All events by this company"
```

---

## 🎫 Scenario 3: Event Creation & Pricing

### **Step 1: Event Manager Creates Event**

**Location:** `/admin/events/create`

```yaml
Event: "Tech Summit 2026"
Date: March 15, 2026
Venue: Bangalore Convention Center
```

### **Step 2: Configure Ticket Types with Pricing**

**Example Ticket Configuration:**

```javascript
Ticket Type: "Early Bird"
├── Base Price: ₹5,000
├── Currency: INR
├── Quantity: 100
└── Tax Calculation: EXCLUSIVE (taxes added on top)

Ticket Type: "Regular"
├── Base Price: ₹7,500
├── Currency: INR
├── Quantity: 200
└── Tax Calculation: EXCLUSIVE

Ticket Type: "VIP"
├── Base Price: ₹15,000
├── Currency: INR
├── Quantity: 50
└── Tax Calculation: EXCLUSIVE
```

### **Step 3: Select Applicable Taxes**

**Taxes Applied to Event:**
- ✅ India GST (18%) - CGST 9% + SGST 9%
- ✅ Service Charge (5%)

---

## 💰 Scenario 4: User Registration & Invoice Generation

### **Step 1: User Selects Ticket**

**User:** Rajesh Kumar  
**Ticket:** Early Bird (₹5,000)  
**Quantity:** 2 tickets

### **Step 2: System Calculates Total**

#### **Tax Calculation (EXCLUSIVE Mode)**

```
Base Amount:        ₹5,000 × 2 = ₹10,000

Tax Breakdown:
├── CGST (9%):      ₹10,000 × 9%  = ₹900
├── SGST (9%):      ₹10,000 × 9%  = ₹900
└── Service (5%):   ₹10,000 × 5%  = ₹500

Subtotal:           ₹10,000
Total Tax:          ₹2,300
─────────────────────────────
GRAND TOTAL:        ₹12,300
```

### **Step 3: Invoice Generation**

**Invoice #:** INV-2026-1001

```
┌────────────────────────────────────────────────┐
│  INVOICE                                       │
│  TechConf Events Pvt Ltd                       │
│  GSTIN: 29XXXXX                                │
├────────────────────────────────────────────────┤
│  Bill To: Rajesh Kumar                         │
│  Email: rajesh@example.com                     │
│  Date: January 23, 2026                        │
│  Invoice #: INV-2026-1001                      │
├────────────────────────────────────────────────┤
│  Event: Tech Summit 2026                       │
│  Date: March 15, 2026                          │
├────────────────────────────────────────────────┤
│  ITEM DETAILS                                  │
│                                                │
│  Early Bird Ticket × 2                         │
│  Unit Price: ₹5,000                            │
│  Subtotal: ₹10,000                             │
│                                                │
│  TAX BREAKDOWN                                 │
│  CGST (9%):           ₹900                     │
│  SGST (9%):           ₹900                     │
│  Service Charge (5%): ₹500                     │
│                                                │
│  Total Tax:           ₹2,300                   │
├────────────────────────────────────────────────┤
│  TOTAL AMOUNT:        ₹12,300                  │
│  Payment Status:      PENDING                  │
│  Payment Terms:       NET_30                   │
└────────────────────────────────────────────────┘
```

### **Step 4: Tax Snapshot Storage**

The system stores tax details in `invoice_tax_snapshots` table:

```sql
INSERT INTO invoice_tax_snapshots (
  invoice_id: "inv_xxx",
  tax_name: "CGST",
  tax_rate: 9.0,
  base_amount: 10000,
  tax_amount: 900,
  tax_source: "GLOBAL_TEMPLATE"
)
```

This ensures:
- ✅ Tax rates are locked at invoice creation
- ✅ Future tax changes don't affect old invoices
- ✅ Audit trail for compliance

---

## 💳 Scenario 5: Payment Processing

### **Step 1: User Makes Payment**

**Payment Method:** Credit Card  
**Amount:** ₹12,300  
**Gateway:** Razorpay/Stripe

### **Step 2: Payment Confirmation**

```javascript
Payment Record:
├── Invoice ID: INV-2026-1001
├── Amount Paid: ₹12,300
├── Payment Method: CREDIT_CARD
├── Transaction ID: txn_abc123xyz
├── Status: COMPLETED
├── Date: January 23, 2026, 10:30 AM
└── Gateway: Razorpay
```

### **Step 3: Invoice Update**

```
Invoice Status: PENDING → PAID
Payment Date: January 23, 2026
Amount Paid: ₹12,300
Balance Due: ₹0
```

### **Step 4: Receipt Generation**

**Receipt #:** RCP-2026-1001

```
┌────────────────────────────────────────────────┐
│  PAYMENT RECEIPT                               │
│  TechConf Events Pvt Ltd                       │
├────────────────────────────────────────────────┤
│  Receipt #: RCP-2026-1001                      │
│  Invoice #: INV-2026-1001                      │
│  Date: January 23, 2026, 10:30 AM              │
│                                                │
│  Received From: Rajesh Kumar                   │
│  Amount: ₹12,300                               │
│  Payment Method: Credit Card (****1234)        │
│  Transaction ID: txn_abc123xyz                 │
│                                                │
│  Event: Tech Summit 2026                       │
│  Tickets: Early Bird × 2                       │
│                                                │
│  Status: PAID IN FULL                          │
│  Thank you for your payment!                   │
└────────────────────────────────────────────────┘
```

---

## 📊 Scenario 6: Tax Inclusive Pricing

### **Alternative: Tax INCLUSIVE Mode**

Some companies prefer showing all-inclusive prices.

**Configuration:**
```yaml
Tax Calculation Mode: INCLUSIVE
```

**Same Example with INCLUSIVE Pricing:**

```
Display Price:      ₹12,300 (includes all taxes)

Tax Breakdown (calculated backwards):
├── Base Amount:    ₹10,000
├── CGST (9%):      ₹900
├── SGST (9%):      ₹900
└── Service (5%):   ₹500

Total:              ₹12,300
```

**User sees:** "Early Bird - ₹12,300 (all taxes included)"

---

## 🌍 Scenario 7: Multi-Currency Events

### **International Event Example**

**Event:** "Global Tech Conference"  
**Company Currency:** USD  
**Event Location:** Singapore

**Ticket Pricing:**

```javascript
Ticket Type: "Standard"
├── Base Price: $500 USD
├── Exchange Rate: 1 USD = 83 INR
├── Price in INR: ₹41,500
└── Taxes: Singapore GST (8%)

User from India sees:
├── Price: ₹41,500
├── GST (8%): ₹3,320
└── Total: ₹44,820

User from USA sees:
├── Price: $500
├── GST (8%): $40
└── Total: $540
```

---

## 📈 Scenario 8: Reporting & Analytics

### **Company Admin Dashboard**

**Location:** `/admin/finance/reports`

**Revenue Report:**

```
Tech Summit 2026 - Financial Summary
═══════════════════════════════════════

Total Registrations: 150
├── Early Bird: 100 × ₹5,000 = ₹5,00,000
├── Regular: 40 × ₹7,500 = ₹3,00,000
└── VIP: 10 × ₹15,000 = ₹1,50,000

Gross Revenue:              ₹9,50,000

Tax Collected:
├── CGST (9%):              ₹85,500
├── SGST (9%):              ₹85,500
└── Service Charge (5%):    ₹47,500
Total Tax:                  ₹2,18,500

Net Revenue:                ₹9,50,000
Total Collected:            ₹11,68,500

Payment Status:
├── Paid: ₹10,50,000 (90%)
├── Pending: ₹1,18,500 (10%)
└── Overdue: ₹0
```

### **Tax Liability Report**

```
Tax Payable to Government
═════════════════════════

CGST Collected:     ₹85,500
SGST Collected:     ₹85,500
Total GST:          ₹1,71,000

Service Charge:     ₹47,500 (Company revenue)

Due Date: February 20, 2026
Status: PENDING
```

---

## 🔄 Scenario 9: Refunds & Cancellations

### **User Requests Refund**

**Original Invoice:** INV-2026-1001 (₹12,300)

**Refund Process:**

```javascript
Refund Request:
├── Invoice: INV-2026-1001
├── Reason: "Unable to attend"
├── Refund Amount: ₹12,300
└── Refund Type: FULL

Tax Adjustment:
├── CGST Refund: ₹900
├── SGST Refund: ₹900
├── Service Refund: ₹500
└── Base Refund: ₹10,000

Credit Note: CN-2026-1001
Status: PROCESSED
Refund Method: Original payment method
Processing Time: 5-7 business days
```

---

## 🎯 Scenario 10: Compound Taxes

### **Complex Tax Structure**

Some regions have compound taxes (tax on tax).

**Example: Luxury Event Tax**

```javascript
Base Price: ₹50,000

Step 1: Apply GST (18%)
├── CGST (9%): ₹4,500
├── SGST (9%): ₹4,500
└── Subtotal: ₹59,000

Step 2: Apply Luxury Tax (10% on total including GST)
└── Luxury Tax: ₹59,000 × 10% = ₹5,900

Final Total: ₹64,900

Tax Breakdown:
├── CGST: ₹4,500
├── SGST: ₹4,500
├── Luxury Tax: ₹5,900
└── Total Tax: ₹14,900
```

---

## 🛠️ Key Features Summary

### **1. Flexibility**
- ✅ Support for any tax structure
- ✅ Multiple currencies
- ✅ Inclusive/Exclusive pricing
- ✅ Company-specific customization

### **2. Compliance**
- ✅ Tax snapshots (audit trail)
- ✅ Detailed invoice breakdowns
- ✅ Tax registration tracking
- ✅ Automated tax calculations

### **3. User Experience**
- ✅ Clear price display
- ✅ Transparent tax breakdown
- ✅ Instant invoice generation
- ✅ Easy payment processing

### **4. Reporting**
- ✅ Revenue analytics
- ✅ Tax liability reports
- ✅ Payment tracking
- ✅ Financial dashboards

---

## 📝 Best Practices

### **For Super Admins:**
1. Create global tax templates for common regions
2. Set reasonable default tax rates
3. Document tax compliance requirements
4. Monitor tax changes across jurisdictions

### **For Company Admins:**
1. Verify tax registration details
2. Choose appropriate tax calculation mode
3. Review tax templates before events
4. Keep tax rates updated

### **For Event Managers:**
1. Select correct taxes for event location
2. Verify pricing includes all applicable taxes
3. Test checkout flow before launch
4. Monitor payment collection

---

## 🚀 Quick Start Guide

### **Setting Up Your First Event with Taxes:**

1. **Super Admin:** Create tax template for your region
2. **Company Admin:** Configure company finance settings
3. **Company Admin:** Review and apply tax templates
4. **Event Manager:** Create event and set ticket prices
5. **Event Manager:** Select applicable taxes
6. **System:** Auto-calculates totals
7. **User:** Registers and pays
8. **System:** Generates invoice with tax breakdown
9. **System:** Stores tax snapshot for compliance
10. **Company:** Views reports and tax liability

---

## 📞 Support & Documentation

For detailed API documentation, see:
- `/docs/api/finance`
- `/docs/api/taxes`
- `/docs/api/invoices`

For compliance questions, contact:
- finance@yourplatform.com
- tax-support@yourplatform.com

---

**Last Updated:** January 23, 2026  
**Version:** 2.0  
**Status:** Production Ready
