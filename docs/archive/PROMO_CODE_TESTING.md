# Promo Code Testing Guide

## ✅ Issue Fixed
The promo code validation error has been resolved. You can now:
1. Create promo codes
2. Apply them during registration
3. See discounts calculated correctly

---

## 🧪 Testing Steps

### Step 1: Create Promo Code "SUMR10"

1. **Navigate to Promo Codes Page:**
   ```
   http://localhost:3001/events/9/registrations/promo-codes
   ```

2. **Fill in the form:**
   - **Code**: `SUMR10`
   - **Discount Type**: `Percentage`
   - **Discount Amount**: `10` (for 10% off)
   - **Min Order Amount**: `0` (or any minimum like 500)
   - **Max Uses**: `100`
   - **Active**: ✅ Checked

3. **Click "Create Promo Code"**

4. **Expected Result:**
   - ✅ Promo code saves successfully
   - ✅ Appears in the list below
   - ✅ Shows "SUMR10" with 10% discount

---

### Step 2: Test Promo Code During Registration

1. **Navigate to Registration Page:**
   ```
   http://localhost:3001/events/9/register
   ```
   (Or use the registration flow for your event)

2. **Fill in Registration Details:**
   - First Name, Last Name, Email
   - Select ticket type (if applicable)
   - Proceed to payment step

3. **Apply Promo Code:**
   - Look for "Promo Code" input field
   - Enter: `SUMR10`
   - Click "Apply" button

4. **Expected Result:**
   - ✅ Success message: "10% discount will be applied"
   - ✅ Original price shown (e.g., ₹500)
   - ✅ Discount shown (e.g., -₹50)
   - ✅ Final amount shown (e.g., ₹450)
   - ✅ No errors in console

---

### Step 3: Verify Auto-Population (If Implemented)

If you have auto-population of promo codes:

1. **Navigate to registration with promo code in URL:**
   ```
   http://localhost:3001/events/9/register?promo=SUMR10
   ```

2. **Expected Result:**
   - ✅ Promo code field auto-filled with "SUMR10"
   - ✅ Discount automatically applied
   - ✅ Final amount shows discounted price

---

## 🔍 API Testing (Optional)

### Test Validate Endpoint

```bash
curl -X POST http://localhost:3001/api/events/9/promo-codes/validate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "code": "SUMR10",
    "orderAmount": 500
  }'
```

**Expected Response:**
```json
{
  "valid": true,
  "code": "SUMR10",
  "discountType": "PERCENT",
  "discountAmount": 10,
  "calculatedDiscount": 50,
  "finalAmount": 450,
  "message": "10% discount will be applied"
}
```

### Test Apply Endpoint

```bash
curl -X POST http://localhost:3001/api/events/9/promo-codes/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "code": "SUMR10",
    "orderAmount": 500
  }'
```

**Expected Response:**
```json
{
  "valid": true,
  "code": "SUMR10",
  "discountType": "PERCENT",
  "discountAmount": 10,
  "calculatedDiscount": 50,
  "originalAmount": 500,
  "finalAmount": 450,
  "description": "10% discount applied"
}
```

---

## ❌ Error Cases to Test

### 1. Invalid Code
- Enter: `INVALID123`
- Expected: "Invalid or inactive promo code"

### 2. Expired Code
- Create a code with end date in the past
- Expected: "Promo code has expired"

### 3. Not Yet Active
- Create a code with start date in the future
- Expected: "Promo code will be active from [date]"

### 4. Usage Limit Reached
- Create a code with max uses = 1
- Use it once
- Try to use again
- Expected: "Promo code usage limit has been reached"

### 5. Minimum Order Not Met
- Create a code with min order = 1000
- Try to apply on order of ₹500
- Expected: "Minimum order amount of ₹1000 is required"

---

## 📊 Different Promo Code Types

### Percentage Discount (10% off)
```
Code: SAVE10
Type: Percentage
Amount: 10
```
**Example:**
- Order: ₹500
- Discount: ₹50 (10%)
- Final: ₹450

### Fixed Amount Discount (₹100 off)
```
Code: FLAT100
Type: Fixed
Amount: 100
```
**Example:**
- Order: ₹500
- Discount: ₹100
- Final: ₹400

### Large Percentage (50% off)
```
Code: HALF50
Type: Percentage
Amount: 50
```
**Example:**
- Order: ₹1000
- Discount: ₹500 (50%)
- Final: ₹500

---

## 🎯 What Was Fixed

### Before (Error):
```
Unknown argument `scope`. Did you mean `code`?
```

### After (Working):
- ✅ Promo codes validate correctly
- ✅ Discounts calculate properly
- ✅ No schema mismatch errors
- ✅ Usage limits enforced
- ✅ Date validations working

### Files Fixed:
1. `/apps/web/app/api/events/[id]/promo-codes/validate/route.ts`
2. `/apps/web/app/api/events/[id]/promo-codes/apply/route.ts`

### Changes Made:
- Changed `scope: 'EVENT'` → `eventId: BigInt(eventId)`
- Changed `scopeRef: eventId` → removed
- Changed `status: 'ACTIVE'` → `isActive: true`
- Removed `include: { redemptions }` (table doesn't exist)
- Updated validation to use `usedCount` and `maxRedemptions`

---

## 🚀 Quick Test Checklist

- [ ] Create promo code "SUMR10" with 10% discount
- [ ] Verify it appears in the promo codes list
- [ ] Go to registration page
- [ ] Enter "SUMR10" in promo code field
- [ ] Click "Apply"
- [ ] Verify discount is calculated correctly
- [ ] Verify final amount is reduced
- [ ] Complete registration with promo code
- [ ] Verify promo code is saved with registration

---

## 📝 Notes

1. **Promo codes are case-insensitive**: "SUMR10", "sumr10", "SuMr10" all work
2. **Codes are trimmed**: Leading/trailing spaces are removed
3. **Usage tracking**: `used_count` increments when code is used
4. **Per-user limits**: Not currently enforced (can be added later)

---

## ✅ Success Criteria

Your promo code system is working if:
- ✅ You can create promo codes without errors
- ✅ You can apply promo codes during registration
- ✅ Discounts calculate correctly (percentage and fixed)
- ✅ Validation rules work (dates, limits, min order)
- ✅ Final amount reflects the discount
- ✅ No console errors or API errors

---

**Docker Status:** ✅ Running  
**Web App:** http://localhost:3001  
**Test Event:** ID 9  
**Promo Code:** SUMR10 (10% off)

**Ready to test!** 🎉
