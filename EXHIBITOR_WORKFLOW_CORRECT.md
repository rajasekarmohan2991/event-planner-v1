# Exhibitor Workflow - Updated Requirements

## Correct Workflow (As Per User Requirements)

### Step 1: Admin Enters Exhibitor Details
**Who:** Admin/Event Manager
**Where:** Exhibitor form
**Action:** Admin fills in:
- Company name
- Contact details
- Booth preferences
- Services requested (electrical, tables, etc.)

**Result:** 
- Exhibitor record created with status: `PENDING_APPROVAL`
- Email sent to exhibitor with their details

---

### Step 2: Admin Approves Booth
**Who:** Admin/Event Manager
**Where:** Exhibitors list page
**Action:** 
- Admin clicks "Approve" button
- Booth number **auto-assigns** (next available)

**Result:**
- Status changes to: `APPROVED`
- Booth number assigned automatically

---

### Step 3: Admin Sets Pricing
**Who:** Admin/Event Manager
**Where:** Exhibitor details/edit page
**Action:** Admin enters:
- Base booth price
- Additional services prices (electrical, tables, etc.)
- Tax calculation (automatic 18% GST)
- **Total amount calculated**

**Result:**
- Pricing saved
- Status changes to: `PAYMENT_PENDING`

---

### Step 4: Payment Link Generated
**Who:** System (automatic)
**Where:** Payment status column
**Action:** 
- System generates unique payment link
- Link appears in "Payment Status" column
- Admin can copy/send link to exhibitor

**Result:**
- Payment link available
- Email sent to exhibitor with payment link and amount breakdown

---

### Step 5: Payment Received
**Who:** Exhibitor (pays online)
**Where:** Payment gateway
**Action:** 
- Exhibitor clicks payment link
- Completes payment

**Result:**
- Status changes to: `ALLOCATED`
- Payment marked as `COMPLETED`
- Confirmation email sent to exhibitor with QR code

---

### Step 6: Action Buttons (After Payment)
**Who:** Admin
**Where:** Exhibitors list page
**Available Actions:**
1. **Edit** - Modify exhibitor details
2. **Delete** - Remove exhibitor (if not paid)
3. **Refund** - Process refund (if paid and exhibitor opts out)

---

## Status Flow

```
PENDING_APPROVAL (Admin enters details)
    ↓ (Admin approves)
APPROVED (Booth auto-assigned)
    ↓ (Admin sets pricing)
PAYMENT_PENDING (Payment link generated)
    ↓ (Exhibitor pays)
ALLOCATED (Payment received)
    ↓ (Optional: Exhibitor opts out)
REFUNDED (Refund processed)
```

---

## Implementation Changes Needed

### 1. Exhibitor Form (Admin-facing)
- Remove self-registration
- Admin fills all details
- Send email to exhibitor with details

### 2. Exhibitors List Page
- Add "Approve" button (for PENDING_APPROVAL status)
- Add "Set Pricing" button (for APPROVED status)
- Show payment link (for PAYMENT_PENDING status)
- Action buttons: Edit, Delete, Refund

### 3. Auto-assign Booth Number
- When admin clicks "Approve"
- System finds next available booth number
- Assigns automatically

### 4. Pricing Page/Modal
- Admin enters base price
- Admin enters service prices
- System calculates tax (18%)
- System calculates total
- Generates payment link

### 5. Payment Link
- Unique URL for each exhibitor
- Shows amount breakdown
- Integrates with payment gateway
- Updates status on payment

### 6. Refund Functionality
- New endpoint: `/api/events/[id]/exhibitors/[exhibitorId]/refund`
- Process refund through payment gateway
- Update status to REFUNDED
- Send refund confirmation email

---

## Current Implementation vs Required

| Feature | Current | Required | Status |
|---------|---------|----------|--------|
| Admin enters details | ✅ Yes | ✅ Yes | ✅ DONE |
| Email to exhibitor | ✅ Yes | ✅ Yes | ✅ DONE |
| Approve button | ❌ No | ✅ Yes | 🔧 TODO |
| Auto-assign booth | ❌ No | ✅ Yes | 🔧 TODO |
| Admin sets pricing | ❌ No | ✅ Yes | 🔧 TODO |
| Payment link in list | ❌ No | ✅ Yes | 🔧 TODO |
| Status: ALLOCATED | ✅ Yes (as CONFIRMED) | ✅ Yes | ✅ DONE |
| Edit button | ❌ No | ✅ Yes | 🔧 TODO |
| Delete button | ❌ No | ✅ Yes | 🔧 TODO |
| Refund button | ❌ No | ✅ Yes | 🔧 TODO |

---

## Next Steps

1. Modify exhibitor list page to add action buttons
2. Create approval endpoint with auto-booth assignment
3. Create pricing modal/page for admin
4. Add payment link display in list
5. Implement refund functionality
6. Update status flow
