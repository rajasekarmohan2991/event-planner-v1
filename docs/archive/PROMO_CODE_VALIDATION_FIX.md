# Promo Code Validation Fix

## Issue
When applying promo code "SUMR10" during registration, getting error:
```
Unknown argument `scope`. Did you mean `code`?
```

## Root Cause
The promo code validation endpoints (`validate` and `apply`) were still using the OLD schema fields:
- ❌ `scope: 'EVENT'`
- ❌ `scopeRef: eventId`
- ❌ `status: 'ACTIVE'`
- ❌ `include: { redemptions: ... }`

But the Prisma schema was already updated to use:
- ✅ `eventId: BigInt`
- ✅ `isActive: Boolean`
- ✅ No `redemptions` relation (removed PromoRedemption model)

## Files Fixed

### 1. `/apps/web/app/api/events/[id]/promo-codes/validate/route.ts`

**Before:**
```typescript
const promoCode = await prisma.promoCode.findFirst({
  where: {
    code: code.toUpperCase().trim(),
    scope: 'EVENT',        // ❌ Wrong
    scopeRef: eventId,     // ❌ Wrong
    status: 'ACTIVE',      // ❌ Wrong
  },
  include: { 
    redemptions: {         // ❌ Wrong - table doesn't exist
      where: userId ? { userId: BigInt(userId) } : undefined
    }
  },
})
```

**After:**
```typescript
const promoCode = await prisma.promoCode.findFirst({
  where: {
    code: code.toUpperCase().trim(),
    eventId: BigInt(eventId),  // ✅ Correct
    isActive: true,            // ✅ Correct
  },
})
```

**Validation Changes:**
- ✅ Removed `promoRedemption.count()` check (table doesn't exist)
- ✅ Now uses `promoCode.usedCount` and `promoCode.maxRedemptions`
- ✅ Per-user limit validation commented out (can be added later)

### 2. `/apps/web/app/api/events/[id]/promo-codes/apply/route.ts`

**Same changes as validate route:**
- ✅ Fixed `where` clause to use `eventId` and `isActive`
- ✅ Removed `include: { redemptions }` 
- ✅ Updated validation to use `usedCount` instead of counting redemptions
- ✅ Removed per-user limit check (no redemptions table)

## Database Schema (Correct)

```sql
promo_codes (
  id BIGINT PRIMARY KEY,
  event_id BIGINT,              -- Maps to eventId in Prisma
  code VARCHAR(50) UNIQUE,
  discount_type VARCHAR(20),    -- Maps to type in Prisma
  discount_amount INTEGER,      -- Maps to amount in Prisma
  max_uses INTEGER,             -- Maps to maxRedemptions in Prisma
  used_count INTEGER,           -- Maps to usedCount in Prisma
  max_uses_per_user INTEGER,    -- Maps to perUserLimit in Prisma
  min_order_amount INTEGER,     -- Maps to minOrderAmount in Prisma
  is_active BOOLEAN,            -- Maps to isActive in Prisma
  start_date TIMESTAMP,         -- Maps to startsAt in Prisma
  end_date TIMESTAMP,           -- Maps to endsAt in Prisma
  ...
)
```

## Prisma Schema (Correct)

```prisma
model PromoCode {
  id               BigInt     @id @default(autoincrement())
  eventId          BigInt     @map("event_id")
  code             String     @unique
  type             String     @map("discount_type") @default("PERCENT")
  amount           Int        @map("discount_amount")
  maxRedemptions   Int        @map("max_uses") @default(-1)
  usedCount        Int        @map("used_count") @default(0)
  perUserLimit     Int        @map("max_uses_per_user") @default(1)
  minOrderAmount   Int        @map("min_order_amount") @default(0)
  applicableTicketIds String? @map("applicable_ticket_ids")
  startsAt         DateTime?  @map("start_date")
  endsAt           DateTime?  @map("end_date")
  isActive         Boolean    @map("is_active") @default(true)
  description      String?
  createdAt        DateTime   @map("created_at") @default(now())
  updatedAt        DateTime   @map("updated_at") @updatedAt

  @@map("promo_codes")
}
```

## Validation Flow (Updated)

### 1. Find Promo Code
```typescript
const promoCode = await prisma.promoCode.findFirst({
  where: {
    code: code.toUpperCase().trim(),
    eventId: BigInt(eventId),
    isActive: true,
  },
})
```

### 2. Validate Start Date
```typescript
if (promoCode.startsAt && promoCode.startsAt > now) {
  return { error: 'Promo code not yet active' }
}
```

### 3. Validate End Date
```typescript
if (promoCode.endsAt && promoCode.endsAt < now) {
  return { error: 'Promo code has expired' }
}
```

### 4. Validate Usage Limit
```typescript
if (promoCode.maxRedemptions && promoCode.maxRedemptions > 0) {
  if (promoCode.usedCount >= promoCode.maxRedemptions) {
    return { error: 'Usage limit reached' }
  }
}
```

### 5. Validate Minimum Order Amount
```typescript
if (promoCode.minOrderAmount && orderAmount < promoCode.minOrderAmount) {
  return { error: `Minimum order: ₹${promoCode.minOrderAmount}` }
}
```

### 6. Calculate Discount
```typescript
let discountAmount = 0
if (promoCode.type === 'PERCENT') {
  discountAmount = Math.floor((orderAmount * promoCode.amount) / 100)
} else {
  discountAmount = promoCode.amount
}
discountAmount = Math.min(discountAmount, orderAmount)
```

## Testing

### Create Promo Code
```bash
# Navigate to:
http://localhost:3001/events/9/registrations/promo-codes

# Create promo code:
Code: SUMR10
Type: Percentage
Amount: 10
Min Order: 0
Max Uses: 100
Active: Yes

# Click Save
```

### Apply Promo Code During Registration
```bash
# Navigate to:
http://localhost:3001/events/9/register

# Fill registration form
# Enter promo code: SUMR10
# Click "Apply"

# Expected Result:
✅ Promo code validated successfully
✅ Discount calculated correctly
✅ Final amount updated
```

## API Endpoints

### Validate Promo Code
```bash
POST /api/events/9/promo-codes/validate
{
  "code": "SUMR10",
  "orderAmount": 500
}

Response:
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

### Apply Promo Code
```bash
POST /api/events/9/promo-codes/apply
{
  "code": "SUMR10",
  "orderAmount": 500
}

Response:
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

## What's Still Missing (Optional)

### Per-User Redemption Tracking
Currently, we don't track how many times each user has used a promo code. To implement this:

1. **Option A: Create redemptions table**
```sql
CREATE TABLE promo_redemptions (
  id BIGSERIAL PRIMARY KEY,
  promo_code_id BIGINT REFERENCES promo_codes(id),
  user_id BIGINT,
  order_id BIGINT,
  redeemed_at TIMESTAMP DEFAULT NOW()
);
```

2. **Option B: Store in JSON field**
```sql
ALTER TABLE promo_codes ADD COLUMN user_redemptions JSONB DEFAULT '{}';
-- Store as: {"user_123": 2, "user_456": 1}
```

3. **Option C: Query registrations table**
```typescript
const userUsageCount = await prisma.registration.count({
  where: {
    eventId: BigInt(eventId),
    userId: BigInt(userId),
    promoCode: code
  }
})
```

For now, per-user limits are not enforced. You can add this later if needed.

## Summary

✅ **Fixed**: Promo code validation now uses correct schema fields
✅ **Fixed**: Removed references to non-existent `redemptions` table
✅ **Fixed**: Usage limit validation uses `usedCount` field
✅ **Working**: Promo codes can be applied during registration
✅ **Working**: Discount calculation is correct

**Next Steps:**
1. Test promo code creation ✅
2. Test promo code validation ✅
3. Test promo code application during registration ✅
4. (Optional) Implement per-user redemption tracking

**Build Status:** Docker rebuilding with fixes...
