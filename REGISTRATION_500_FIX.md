# Registration 500 Error - Fix Guide

## Issue
`POST /api/events/9/registrations` returns 500 Internal Server Error

## Error Details
```
Failed to load resource: the server responded with a status of 500 ()
/api/events/9/registrations:1  Failed to load resource: the server responded with a status of 500 ()
```

---

## ✅ Immediate Fix Applied

### Enhanced Error Logging
**File:** `apps/web/app/api/events/[id]/registrations/route.ts`

**Added:**
- Detailed error logging with error code, name, message, and stack
- Specific error messages for common Prisma errors
- Better error response with hints

**Now you'll see in console:**
```
❌ Error creating registration: [error object]
❌ Error name: PrismaClientKnownRequestError
❌ Error message: [specific message]
❌ Error code: P2003
❌ Error stack: [full stack trace]
```

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console
After trying to register, check the browser console for the detailed error response:

```javascript
{
  "message": "Payment record creation failed",
  "details": { "hint": "Check if payments table exists" },
  "originalError": "Table 'payments' doesn't exist",
  "code": "P2003"
}
```

### Step 2: Check Server Logs
Look at your Next.js server console for the detailed error logs:

```bash
# You should see:
❌ Error creating registration: ...
❌ Error code: P2003
❌ Error message: Foreign key constraint failed
```

### Step 3: Identify the Failing Step
The registration process has multiple steps:

1. ✅ Parse request body
2. ✅ Validate required fields (email, firstName, lastName)
3. ✅ Validate promo code (if provided)
4. ❌ **Create registration record** ← Likely failing here
5. ❌ **Create payment record** ← Or here
6. ❌ **Create approval record** ← Or here
7. ❌ **Create promo redemption** ← Or here

---

## 🎯 Common Causes & Solutions

### Cause 1: Missing Database Tables

**Error:**
```
Table 'payments' doesn't exist
Table 'registration_approvals' doesn't exist
Table 'promo_redemptions' doesn't exist
```

**Solution:**
Run Prisma migrations to create missing tables:

```bash
cd apps/web
npx prisma migrate dev --name add_missing_tables
```

Or manually create tables:

```sql
-- payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL,
  event_id BIGINT NOT NULL,
  user_id BIGINT,
  amount_in_minor INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  payment_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- registration_approvals table
CREATE TABLE IF NOT EXISTS registration_approvals (
  id BIGSERIAL PRIMARY KEY,
  registration_id UUID NOT NULL,
  event_id BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL,
  approved_by BIGINT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- promo_redemptions table
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id BIGSERIAL PRIMARY KEY,
  promo_code_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  order_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Cause 2: Foreign Key Constraint Failure

**Error:**
```
code: 'P2003'
message: 'Foreign key constraint failed on the field: event_id'
```

**Reason:**
- Event with ID 9 doesn't exist in database
- User ID doesn't exist
- Promo code ID doesn't exist

**Solution:**
Check if the event exists:

```sql
SELECT id, name FROM events WHERE id = 9;
```

If not, create it or use a different event ID.

---

### Cause 3: Invalid Data Type

**Error:**
```
code: 'P2007'
message: 'Data validation error'
```

**Reason:**
- eventId is not a valid BigInt
- userId is not a valid BigInt
- JSON data is malformed

**Solution:**
Check the request payload:

```javascript
{
  "data": {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "company": "Acme Inc",
    "jobTitle": "Developer"
  },
  "type": "VIRTUAL",
  "totalPrice": 1000,
  "promoCode": "SAVE10"
}
```

---

### Cause 4: Duplicate Registration

**Error:**
```
code: 'P2002'
message: 'Unique constraint failed'
```

**Reason:**
- User already registered for this event
- Email already used for this event

**Solution:**
Check for existing registration:

```sql
SELECT * FROM registrations 
WHERE event_id = 9 
AND data_json->>'email' = 'user@example.com';
```

If exists, either:
- Delete the old registration
- Update the existing one
- Show "Already registered" message

---

### Cause 5: Missing Required Fields

**Error:**
```
status: 400
message: 'Missing required fields: email, firstName, and lastName are required'
```

**Reason:**
Request body doesn't include required fields.

**Solution:**
Ensure your form sends:

```javascript
{
  "data": {
    "email": "required",
    "firstName": "required",
    "lastName": "required",
    "phone": "optional",
    "company": "optional",
    "jobTitle": "optional"
  }
}
```

---

## 🔧 Quick Fixes

### Fix 1: Simplify Registration (Remove Optional Tables)

If `payments`, `registration_approvals`, or `promo_redemptions` tables don't exist and you don't need them immediately:

**Comment out the problematic code:**

```typescript
// In apps/web/app/api/events/[id]/registrations/route.ts
// Lines ~316-349, ~371-383, ~352-368

const result = await prisma.$transaction(async (tx) => {
  // 1. Create Registration
  const registration = await tx.registration.create({
    data: {
      eventId: eventId,
      dataJson: registrationData,
      type: parsed?.type || 'VIRTUAL',
      email: registrationData.email,
      createdAt: new Date(),
      status: 'APPROVED'
    }
  })

  // COMMENT OUT payments insert
  // COMMENT OUT registration_approvals insert
  // COMMENT OUT promo_redemptions insert

  return registration
})
```

---

### Fix 2: Use Order Model Instead of Raw SQL

Replace raw SQL payment insert with Order model:

```typescript
// Replace lines ~316-349 with:
await tx.order.create({
  data: {
    eventId: String(eventId),
    userId: userId,
    email: registrationData.email,
    status: finalAmount > 0 ? 'PAID' : 'CREATED',
    paymentStatus: finalAmount > 0 ? 'COMPLETED' : 'FREE',
    totalInr: finalAmount,
    meta: {
      registrationId: regIdStr,
      originalAmount: totalPrice,
      discountAmount: discountAmount,
      promoCode: promoCode,
      paymentMethod: paymentMethod
    },
    createdAt: new Date()
  }
})
```

---

### Fix 3: Make Approval Optional

```typescript
// Wrap in try-catch to make it optional
try {
  await tx.$executeRaw`
    INSERT INTO registration_approvals (...)
    VALUES (...)
  `
} catch (e) {
  console.warn('Approval record creation skipped:', e)
  // Continue without approval record
}
```

---

## 📊 Testing

### Test 1: Simple Registration (No Promo, No Payment)
```bash
curl -X POST http://localhost:3000/api/events/9/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "phone": "+1234567890"
    },
    "type": "VIRTUAL",
    "totalPrice": 0
  }'
```

**Expected:** 201 Created

---

### Test 2: With Payment
```bash
curl -X POST http://localhost:3000/api/events/9/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User"
    },
    "totalPrice": 1000,
    "paymentMethod": "CARD"
  }'
```

**Expected:** 201 Created with payment record

---

### Test 3: With Promo Code
```bash
curl -X POST http://localhost:3000/api/events/9/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User"
    },
    "totalPrice": 1000,
    "promoCode": "SAVE10"
  }'
```

**Expected:** 201 Created with discount applied

---

## 🎯 Recommended Solution

### Option 1: Create Missing Tables (Best)
```bash
cd apps/web
npx prisma db push
```

This will:
- Create all tables from schema
- Add missing columns
- Update constraints

### Option 2: Simplify Registration (Quick)
Comment out optional table inserts and just create the registration record.

### Option 3: Use Existing Models (Clean)
Replace raw SQL with Prisma models wherever possible.

---

## 📝 Checklist

- [ ] Check browser console for error details
- [ ] Check server logs for error code
- [ ] Verify event exists in database
- [ ] Verify required tables exist
- [ ] Test with simple registration (no promo, no payment)
- [ ] Test with payment
- [ ] Test with promo code
- [ ] Check for duplicate registrations
- [ ] Verify foreign key constraints

---

## 🚀 Next Steps

1. **Try to register again** - Check the new error message
2. **Look at server console** - See the detailed error logs
3. **Identify the failing step** - payments? approvals? promo?
4. **Apply the appropriate fix** - Create table or comment out code
5. **Test again** - Verify registration works

---

## 📞 Support

If the error persists:
1. Share the error message from browser console
2. Share the error logs from server console
3. Share the error code (P2002, P2003, etc.)
4. Check if the event exists: `SELECT * FROM events WHERE id = 9`
5. Check database schema: `\d registrations` in psql

---

## Files Modified

- ✅ `apps/web/app/api/events/[id]/registrations/route.ts` - Enhanced error logging

---

## Summary

**What was done:**
- Added detailed error logging
- Added specific error messages for common issues
- Added hints for troubleshooting

**What you need to do:**
1. Try to register again
2. Check the error message (now more detailed)
3. Apply the appropriate fix based on the error
4. Test registration

**Most likely issue:**
- Missing `payments` table
- Missing `registration_approvals` table
- Missing `promo_redemptions` table

**Quick fix:**
Run `npx prisma db push` to create all tables from schema.
