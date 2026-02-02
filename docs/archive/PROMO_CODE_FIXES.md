# Promo Code Validation & Application Fixes

## Date: November 14, 2025 4:30 PM IST

---

## 🐛 Issues Fixed

### 1. **500 Internal Server Error**
**Problem**: `GET /api/events/8/promo-codes` returned 500 error
**Root Cause**: Prisma couldn't find `PromoCode` table - schema had model name but no `@@map` directive to match snake_case database table name

### 2. **Mock Data Instead of Database**
**Problem**: Apply promo code endpoint was using hardcoded mock data
**Root Cause**: `/api/events/[id]/promo-codes/apply/route.ts` had mock promo codes instead of database queries

### 3. **Insufficient Validation**
**Problem**: Promo codes weren't properly validated for:
- Start/end dates
- Usage limits (total and per-user)
- Minimum order amounts
- Active status

---

## ✅ Solutions Applied

### 1. **Fixed Prisma Schema Mapping**

**File**: `/apps/web/prisma/schema.prisma`

**Added `@@map` directives**:
```prisma
model PromoCode {
  // ... fields ...
  
  @@map("promo_codes")  // ✅ Maps to snake_case table
}

model PromoRedemption {
  // ... fields ...
  
  @@map("promo_redemptions")  // ✅ Maps to snake_case table
}
```

**Result**: Prisma now correctly finds `promo_codes` and `promo_redemptions` tables in database

---

### 2. **Replaced Mock Data with Database Queries**

**File**: `/apps/web/app/api/events/[id]/promo-codes/apply/route.ts`

**Before** (Mock Data):
```typescript
const mockPromoCodes = [
  {
    code: 'EARLY25',
    eventId: eventId,
    discountType: 'PERCENT',
    discountAmount: 25,
    // ...
  }
]
const promoCode = mockPromoCodes.find(...)
```

**After** (Database Query):
```typescript
const promoCode = await prisma.promoCode.findFirst({
  where: {
    code: code.toUpperCase().trim(),
    scope: 'EVENT',
    scopeRef: eventId,
    status: 'ACTIVE',
  },
  include: { 
    redemptions: {
      where: userId ? { userId: BigInt(userId) } : undefined
    }
  },
})
```

---

### 3. **Comprehensive Validation System**

**Both `/apply` and `/validate` endpoints now check**:

#### ✅ Validation 1: Start Date
```typescript
if (promoCode.startsAt && promoCode.startsAt > now) {
  return { error: `Promo code will be active from ${startDate}` }
}
```

#### ✅ Validation 2: Expiry Date
```typescript
if (promoCode.endsAt && promoCode.endsAt < now) {
  return { error: 'Promo code has expired' }
}
```

#### ✅ Validation 3: Total Usage Limit
```typescript
if (promoCode.maxRedemptions) {
  const totalRedemptions = await prisma.promoRedemption.count({
    where: { promoCodeId: promoCode.id }
  })
  
  if (totalRedemptions >= promoCode.maxRedemptions) {
    return { error: 'Promo code usage limit has been reached' }
  }
}
```

#### ✅ Validation 4: Per-User Limit
```typescript
if (promoCode.perUserLimit && userId) {
  const userRedemptions = promoCode.redemptions.length
  
  if (userRedemptions >= promoCode.perUserLimit) {
    return { error: `You have already used this promo code ${promoCode.perUserLimit} time(s)` }
  }
}
```

#### ✅ Validation 5: Minimum Order Amount
```typescript
if (promoCode.minOrderAmount && orderAmount < promoCode.minOrderAmount) {
  return { error: `Minimum order amount of ₹${promoCode.minOrderAmount} is required` }
}
```

#### ✅ Validation 6: Discount Calculation
```typescript
if (promoCode.type === 'PERCENT') {
  discountAmount = Math.floor((originalAmount * Number(promoCode.amount)) / 100)
} else if (promoCode.type === 'FIXED') {
  discountAmount = Number(promoCode.amount)
}

// Ensure discount doesn't exceed order amount
discountAmount = Math.min(discountAmount, originalAmount)
```

---

## 📊 API Endpoints Updated

### 1. **GET `/api/events/[id]/promo-codes`**
**Status**: ✅ Now works (Prisma schema fixed)
**Returns**: List of promo codes for the event

### 2. **POST `/api/events/[id]/promo-codes`**
**Status**: ✅ Now works (Prisma schema fixed)
**Creates**: New promo code in database

### 3. **POST `/api/events/[id]/promo-codes/apply`**
**Status**: ✅ Completely rewritten
**Changes**:
- Removed mock data
- Added database queries
- Added 6 validation checks
- Added authentication
- Proper error messages

**Request**:
```json
{
  "code": "EARLY25",
  "orderAmount": 1000
}
```

**Success Response**:
```json
{
  "valid": true,
  "code": "EARLY25",
  "discountType": "PERCENT",
  "discountAmount": 25,
  "calculatedDiscount": 250,
  "originalAmount": 1000,
  "finalAmount": 750,
  "description": "25% discount applied"
}
```

**Error Response**:
```json
{
  "valid": false,
  "error": "Promo code has expired"
}
```

### 4. **POST `/api/events/[id]/promo-codes/validate`**
**Status**: ✅ Enhanced with comprehensive validation
**Changes**:
- Changed from query params to request body
- Added all 6 validation checks
- Better error messages
- Per-user redemption tracking

---

## 🔐 Security & Validation Features

### Input Validation:
- ✅ Code is required and trimmed
- ✅ Code converted to uppercase for consistency
- ✅ Order amount must be a positive number
- ✅ Authentication required (session check)

### Business Logic Validation:
- ✅ Promo code must exist in database
- ✅ Promo code must be ACTIVE status
- ✅ Promo code must be for the correct event
- ✅ Current date must be within valid date range
- ✅ Total redemptions must not exceed limit
- ✅ User redemptions must not exceed per-user limit
- ✅ Order amount must meet minimum requirement

### Data Integrity:
- ✅ Discount never exceeds order amount
- ✅ All numeric calculations use `Number()` conversion
- ✅ BigInt handling for user IDs
- ✅ Proper error logging

---

## 🧪 Testing Instructions

### 1. Clear Browser Cache
- **Mac**: `Cmd + Shift + R`
- **Windows**: `Ctrl + F5`

### 2. Create a Test Promo Code
1. Login as admin/event manager
2. Go to event promo codes page
3. Create a new promo code:
   - Code: `TEST25`
   - Type: PERCENT
   - Amount: 25
   - Max Uses: 10
   - Per User Limit: 2
   - Min Order: 100
   - Start Date: Today
   - End Date: Next month
   - Status: ACTIVE

### 3. Test Validation Scenarios

#### ✅ Valid Promo Code:
```bash
curl -X POST http://localhost:3001/api/events/1/promo-codes/apply \
  -H "Content-Type: application/json" \
  -d '{"code": "TEST25", "orderAmount": 500}'
```
**Expected**: 25% discount applied, finalAmount = 375

#### ❌ Invalid Code:
```bash
curl -X POST http://localhost:3001/api/events/1/promo-codes/apply \
  -H "Content-Type: application/json" \
  -d '{"code": "INVALID", "orderAmount": 500}'
```
**Expected**: "Invalid promo code"

#### ❌ Below Minimum:
```bash
curl -X POST http://localhost:3001/api/events/1/promo-codes/apply \
  -H "Content-Type: application/json" \
  -d '{"code": "TEST25", "orderAmount": 50}'
```
**Expected**: "Minimum order amount of ₹100 is required"

#### ❌ Expired Code:
- Set end date to yesterday
- Try to apply
**Expected**: "Promo code has expired"

#### ❌ Usage Limit Reached:
- Use promo code 2 times (per-user limit)
- Try 3rd time
**Expected**: "You have already used this promo code 2 time(s)"

### 4. Test During Registration
1. Go to event registration page
2. Select seats (total > ₹100)
3. Enter promo code: `TEST25`
4. Click "Apply"
5. Verify:
   - ✅ Discount is calculated correctly
   - ✅ Final amount is updated
   - ✅ Success message shows

---

## 📝 Files Modified

### 1. `/apps/web/prisma/schema.prisma`
- Added `@@map("promo_codes")` to PromoCode model
- Added `@@map("promo_redemptions")` to PromoRedemption model

### 2. `/apps/web/app/api/events/[id]/promo-codes/apply/route.ts`
- Complete rewrite (135 lines)
- Removed mock data
- Added database queries
- Added 6 validation checks
- Added authentication
- Better error handling

### 3. `/apps/web/app/api/events/[id]/promo-codes/validate/route.ts`
- Enhanced validation (117 lines)
- Changed from query params to request body
- Added all 6 validation checks
- Added per-user redemption tracking
- Better error messages

---

## 🎯 Validation Rules Summary

| Rule | Check | Error Message |
|------|-------|---------------|
| **Code Exists** | Database lookup | "Invalid promo code" |
| **Active Status** | status = 'ACTIVE' | "Invalid or inactive promo code" |
| **Start Date** | startsAt <= now | "Promo code will be active from {date}" |
| **End Date** | endsAt >= now | "Promo code has expired" |
| **Total Limit** | redemptions < maxRedemptions | "Promo code usage limit has been reached" |
| **User Limit** | userRedemptions < perUserLimit | "You have already used this promo code X time(s)" |
| **Min Amount** | orderAmount >= minOrderAmount | "Minimum order amount of ₹X is required" |
| **Discount Cap** | discount <= orderAmount | Automatic capping |

---

## ✅ Verification Checklist

- [x] Prisma schema has @@map directives
- [x] GET /api/events/[id]/promo-codes works
- [x] POST /api/events/[id]/promo-codes works
- [x] Apply endpoint uses database
- [x] Apply endpoint has all validations
- [x] Validate endpoint has all validations
- [x] Authentication required
- [x] Error messages are user-friendly
- [x] Discount calculations are accurate
- [x] Docker build successful
- [x] Changes deployed

---

## 🎉 Summary

**Fixed**:
- ✅ 500 error on promo codes API
- ✅ Mock data replaced with database
- ✅ Comprehensive validation system

**Added Validations**:
- ✅ Start/end date checks
- ✅ Total usage limit
- ✅ Per-user usage limit
- ✅ Minimum order amount
- ✅ Active status check
- ✅ Discount capping

**Security**:
- ✅ Authentication required
- ✅ Input sanitization
- ✅ SQL injection prevention (Prisma)
- ✅ Proper error handling

**Result**: Promo codes can now be saved, validated, and applied during registration with comprehensive business logic validation! 🎊

---

**Status**: ✅ COMPLETE & DEPLOYED
**Action Required**: Clear cache and test promo code functionality!
