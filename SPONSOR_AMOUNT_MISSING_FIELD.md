# Sponsor Amount Not Showing - Root Cause & Fix

## 🔍 Problem

Sponsor amount shows ₹0.00 even after saving a sponsor with an amount.

## 🎯 Root Cause

**The sponsor form is MISSING the "Sponsorship Amount" field!**

Looking at `/apps/web/components/events/sponsors/sections/ContactPayment.tsx`:
- Line 121-127: Has "Amount Paid" field
- **MISSING**: "Sponsorship Amount" or "Total Amount" field

The form only has:
- ✅ Payment Mode
- ✅ Payment Status  
- ✅ **Amount Paid** (partial payment)
- ✅ Payment Due Date
- ✅ Transaction ID
- ❌ **Sponsorship Amount** (MISSING!)

## 💡 Solution

Add a "Sponsorship Amount" field in the payment section.

### **File to Edit**:
`/apps/web/components/events/sponsors/sections/ContactPayment.tsx`

### **Add This Field** (after line 119, before "Amount Paid"):

```typescript
<div className="space-y-2">
    <Label htmlFor="amount">Sponsorship Amount *</Label>
    <Input
        id="amount"
        type="number"
        value={payment.amount || ''}
        onChange={(e) => updatePayment('amount', Number(e.target.value))}
        placeholder="Enter total sponsorship amount"
    />
</div>
```

### **Updated Layout**:

```
Payment Information
├── Payment Mode * (dropdown)
├── Payment Status * (dropdown)
├── Sponsorship Amount * (NEW - total amount)
├── Amount Paid (partial payment)
├── Payment Due Date
├── Transaction ID
└── GST Invoice Required (checkbox)
```

---

## 📊 Data Flow

### **How Amount is Stored**:

1. User enters amount in form: `50000`
2. Form stores in `paymentData.amount`
3. API saves to database: `payment_data = {"amount": 50000, ...}`
4. API fetches: Returns `paymentData` JSON
5. Frontend displays: Extracts `item.amount || paymentData.amount`

### **Current Issue**:

1. User fills form
2. **No amount field** → `paymentData.amount` is `undefined`
3. API saves: `payment_data = {"paymentMode": "...", "paymentStatus": "..."}`
4. API fetches: `paymentData.amount` is `undefined`
5. Frontend displays: `₹0.00` (because both `item.amount` and `paymentData.amount` are undefined)

---

## 🔧 Quick Fix Steps

### **Option 1: Add Field to Form** (Recommended)

1. Edit `/apps/web/components/events/sponsors/sections/ContactPayment.tsx`
2. Add the "Sponsorship Amount" field after line 119
3. Save and deploy
4. Users can now enter the sponsorship amount
5. Amount will display correctly

### **Option 2: Database Direct Fix** (Temporary)

If you have existing sponsors with ₹0.00, update them directly:

```sql
-- Update specific sponsor
UPDATE sponsors 
SET payment_data = jsonb_set(
  payment_data, 
  '{amount}', 
  '50000'::jsonb
)
WHERE id = 'SPONSOR_ID';

-- Or update all sponsors at once (set default amount)
UPDATE sponsors 
SET payment_data = jsonb_set(
  COALESCE(payment_data, '{}'::jsonb), 
  '{amount}', 
  '100000'::jsonb
)
WHERE (payment_data->>'amount') IS NULL;
```

---

## 📝 Complete Form Fields

After adding the field, the payment section should have:

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| Payment Mode | Dropdown | Yes | How they'll pay (Bank/Cheque/UPI) |
| Payment Status | Dropdown | Yes | Pending/Paid/Partial |
| **Sponsorship Amount** | Number | **Yes** | **Total sponsorship value** |
| Amount Paid | Number | No | How much paid so far |
| Payment Due Date | Date | No | When payment is due |
| Transaction ID | Text | No | Reference number |
| GST Invoice Required | Checkbox | No | Whether invoice needed |

---

## 🎯 Testing After Fix

1. **Add new sponsor**:
   - Fill basic info
   - Go to "Contact & Payment" step
   - **Enter Sponsorship Amount**: ₹50,000
   - Enter Amount Paid: ₹20,000
   - Complete and save

2. **Check sponsor list**:
   - Amount column should show: **₹50,000** ✅

3. **Edit existing sponsor**:
   - Click edit
   - Go to payment step
   - **Add Sponsorship Amount** if missing
   - Save

4. **Verify in database**:
```sql
SELECT 
  name, 
  tier,
  payment_data->>'amount' as amount,
  payment_data->>'amountPaid' as amount_paid
FROM sponsors;
```

---

## 🔍 Why This Happened

The form was designed with these fields:
- `amountPaid` - How much has been paid
- But **no field for the total sponsorship amount**

This is like having a field for "down payment" but no field for "total price"!

**Example**:
- Sponsor commits: ₹100,000 (total)
- Paid so far: ₹30,000 (partial)
- Remaining: ₹70,000

**Current form only captures**: ₹30,000 (paid)
**Missing**: ₹100,000 (total commitment)

---

## ✅ Summary

**Problem**: Sponsor amount shows ₹0.00

**Root Cause**: Form is missing "Sponsorship Amount" input field

**Solution**: Add "Sponsorship Amount" field to the payment section

**File**: `/apps/web/components/events/sponsors/sections/ContactPayment.tsx`

**Line**: After line 119 (after Payment Status field)

**Field to Add**:
```tsx
<div className="space-y-2">
    <Label htmlFor="amount">Sponsorship Amount *</Label>
    <Input
        id="amount"
        type="number"
        value={payment.amount || ''}
        onChange={(e) => updatePayment('amount', Number(e.target.value))}
        placeholder="Enter total sponsorship amount"
    />
</div>
```

After this fix, users can enter the sponsorship amount and it will display correctly in the list! 🎉
