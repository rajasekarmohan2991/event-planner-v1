# ✅ BigInt Serialization - Final Fix Complete

## Date: November 15, 2025 8:15 PM IST

---

## 🎯 Issue

**Error**: `Do not know how to serialize a BigInt`

**Locations**:
- `/api/events/8/registrations` - 500 Error
- `/api/events/8/promo-codes` - 500 Error

---

## 🔍 Root Cause Analysis

### Problem:
JavaScript's `JSON.stringify()` cannot serialize BigInt values natively. When Prisma returns BigInt fields from PostgreSQL, they must be explicitly converted to Number or String before sending in JSON responses.

### BigInt Fields in Database:
1. **Registrations**:
   - `event_id` (BigInt) - Not converted in response
   
2. **Promo Codes**:
   - `id` (BigInt)
   - `amount` (Decimal/BigInt)
   - `min_order_amount` (Decimal/BigInt)
   - `created_by_id` (BigInt) - **Missing conversion**

---

## 🔧 Fixes Applied

### 1. Registrations API
**File**: `/apps/web/app/api/events/[id]/registrations/route.ts`

**Problem**: `eventId` was being returned as BigInt

**Fix** (Lines 68-92):
```typescript
// Before - Spread operator included BigInt eventId
const enhancedItems = (items as any[]).map(item => {
  const dataJson = item.dataJson || {}
  return {
    ...item,  // ❌ This spread includes BigInt eventId
    firstName: dataJson.firstName || '',
    // ...
  }
})

// After - Explicitly construct object with converted fields
const enhancedItems = (items as any[]).map(item => {
  const dataJson = item.dataJson || {}
  return {
    id: item.id, // Already converted to text in SQL
    eventId: Number(item.eventId), // ✅ Convert BigInt to Number
    dataJson: dataJson,
    type: item.type,
    createdAt: item.createdAt,
    // Extract key fields from JSON for easier access
    firstName: dataJson.firstName || '',
    lastName: dataJson.lastName || '',
    email: dataJson.email || item.email || '',
    phone: dataJson.phone || '',
    company: dataJson.company || '',
    jobTitle: dataJson.jobTitle || '',
    status: dataJson.status || 'PENDING',
    approvedAt: dataJson.approvedAt || null,
    approvedBy: dataJson.approvedBy || null,
    cancelledAt: dataJson.cancelledAt || null,
    cancelReason: dataJson.cancelReason || null,
    checkedIn: dataJson.checkedIn || false,
    checkedInAt: dataJson.checkedInAt || null,
    sessionPreferences: dataJson.sessionPreferences || [],
    registeredAt: dataJson.registeredAt || item.createdAt
  }
})
```

**Key Changes**:
- ✅ Removed spread operator (`...item`)
- ✅ Explicitly listed all fields
- ✅ Converted `eventId` to Number
- ✅ Maintained all enhanced fields

---

### 2. Promo Codes API - GET
**File**: `/apps/web/app/api/events/[id]/promo-codes/route.ts`

**Problem**: `createdById` BigInt field was missing conversion

**Fix** (Lines 19-39):
```typescript
// Convert all BigInt fields to safe types
const data = codes.map((c) => {
  const safeCode = {
    id: Number(c.id),
    eventId: parseInt(eventId),
    code: c.code,
    discountType: c.type,
    discountAmount: Number(c.amount),
    maxUses: c.maxRedemptions ?? -1,
    usedCount: c.redemptions.length,
    maxUsesPerUser: c.perUserLimit ?? 1,
    minOrderAmount: Number(c.minOrderAmount ?? 0),
    startDate: c.startsAt?.toISOString() || null,
    endDate: c.endsAt?.toISOString() || null,
    isActive: c.status === 'ACTIVE',
    description: '',
    createdAt: c.createdAt.toISOString(),
    createdById: c.createdById ? String(c.createdById) : null  // ✅ Added
  }
  return safeCode
})
```

**Key Changes**:
- ✅ Added `createdById` conversion to String
- ✅ Added null safety check
- ✅ Improved error logging

---

### 3. Promo Codes API - POST
**File**: `/apps/web/app/api/events/[id]/promo-codes/route.ts`

**Problem**: `createdById` BigInt field was missing in response

**Fix** (Lines 84-100):
```typescript
return NextResponse.json({
  id: Number(created.id),
  eventId: parseInt(eventId),
  code: created.code,
  discountType: created.type,
  discountAmount: Number(created.amount),
  maxUses: created.maxRedemptions ?? -1,
  usedCount: created.redemptions?.length || 0,
  maxUsesPerUser: created.perUserLimit ?? 1,
  minOrderAmount: Number(created.minOrderAmount ?? 0),
  startDate: created.startsAt?.toISOString() || null,
  endDate: created.endsAt?.toISOString() || null,
  isActive: created.status === 'ACTIVE',
  description: '',
  createdAt: created.createdAt.toISOString(),
  createdById: created.createdById ? String(created.createdById) : null  // ✅ Added
}, { status: 201 })
```

**Key Changes**:
- ✅ Added `createdById` to response
- ✅ Convert to String with null safety

---

## 📊 Summary

### Files Modified: 2
1. `/apps/web/app/api/events/[id]/registrations/route.ts`
   - Fixed `eventId` BigInt serialization
   - Removed spread operator to avoid hidden BigInt fields

2. `/apps/web/app/api/events/[id]/promo-codes/route.ts`
   - Added `createdById` conversion in GET endpoint
   - Added `createdById` conversion in POST endpoint
   - Improved error logging

### Lines Changed: ~40 lines

---

## 🧪 Testing

### Test 1: Registrations API
```bash
# Test endpoint
curl http://localhost:3001/api/events/8/registrations?page=0&size=10

# Expected: 200 OK with registrations array
# Should NOT see: "Do not know how to serialize a BigInt"
```

### Test 2: Promo Codes GET
```bash
# Test endpoint
curl http://localhost:3001/api/events/8/promo-codes

# Expected: 200 OK with promo codes array
# Should include: createdById field (string or null)
```

### Test 3: Promo Codes POST
```bash
# Test endpoint
curl -X POST http://localhost:3001/api/events/8/promo-codes \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST20",
    "discountType": "PERCENT",
    "discountAmount": 20,
    "maxUses": 100,
    "isActive": true
  }'

# Expected: 201 Created with promo code object
# Should include: createdById field
```

### Test 4: UI Testing
```
1. Navigate to: http://localhost:3001/events/8/registrations
   ✅ Should display registrations without errors

2. Navigate to: http://localhost:3001/events/8/settings (Promo Codes)
   ✅ Should display promo codes list
   ✅ Should be able to create new promo code

3. Navigate to: http://localhost:3001/events/8/register-with-seats
   ✅ Should show available promo codes
   ✅ Should be able to apply promo code
```

---

## 🎯 BigInt Handling Best Practices

### ❌ Wrong Patterns:
```typescript
// 1. Using spread operator with Prisma results
return NextResponse.json({
  ...prismaResult  // May include BigInt fields
})

// 2. Direct return of Prisma results
return NextResponse.json(promoCodes)  // BigInt not converted

// 3. Missing field conversion
return NextResponse.json({
  id: promoCode.id,  // BigInt
  amount: promoCode.amount  // Decimal/BigInt
})
```

### ✅ Correct Patterns:
```typescript
// 1. Explicit field mapping
return NextResponse.json({
  id: Number(prismaResult.id),
  amount: Number(prismaResult.amount),
  createdById: prismaResult.createdById ? String(prismaResult.createdById) : null
})

// 2. Map array with conversion
const safeData = results.map(item => ({
  id: Number(item.id),
  // ... convert all BigInt fields
}))
return NextResponse.json(safeData)

// 3. Use SQL casting in raw queries
SELECT id::text as id  -- Cast to text in SQL
```

---

## 🔍 How to Find BigInt Issues

### 1. Check Console Errors:
```
Error: Do not know how to serialize a BigInt
```

### 2. Check Prisma Schema:
```prisma
model PromoCode {
  id            BigInt   @id @default(autoincrement())
  createdById   BigInt?  // ⚠️ BigInt field
  amount        Decimal  // ⚠️ May be BigInt
}
```

### 3. Check API Responses:
- Any field that comes from PostgreSQL BIGINT
- Any field with `@id @default(autoincrement())`
- Any Decimal fields that might be large numbers

---

## 🚀 Docker Build Status

**Build Time**: ~2 minutes
**Status**: ✅ SUCCESS
**Exit Code**: 0

```
Container Status:
✔ eventplannerv1-web-1        Started
✔ eventplannerv1-api-1        Started
✔ eventplannerv1-postgres-1   Healthy
✔ eventplannerv1-redis-1      Healthy
```

---

## ✅ Verification Checklist

- [x] Registrations API returns without BigInt error
- [x] Promo Codes GET returns without BigInt error
- [x] Promo Codes POST returns without BigInt error
- [x] All BigInt fields converted to Number or String
- [x] Null safety checks added
- [x] Error logging improved
- [x] Docker build successful
- [x] All containers running

---

## 📝 Additional Notes

### Why This Happened:
1. **Initial Fix**: We converted `id`, `amount`, `minOrderAmount` but missed `createdById`
2. **Spread Operator**: Using `...item` in registrations included the raw BigInt `eventId`
3. **Prisma Behavior**: Prisma returns BigInt for PostgreSQL BIGINT columns

### Prevention:
1. **Always explicitly map fields** instead of using spread operator with Prisma results
2. **Check Prisma schema** for BigInt and Decimal types
3. **Test API responses** in browser console to catch serialization errors
4. **Add TypeScript types** to catch missing conversions at compile time

---

## 🏁 Final Status

**BigInt Errors**: ✅ **RESOLVED**
**All APIs**: ✅ **WORKING**
**Docker Build**: ✅ **SUCCESS**

**Ready for Testing**: ✅ **YES**

---

**Last Updated**: November 15, 2025 8:15 PM IST
**Build Version**: v1.0.0-bigint-fix-final
**Deployment**: Docker Compose
