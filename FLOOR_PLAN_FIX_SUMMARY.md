# Floor Plan & Tickets 500 Error - Resolution Summary

## Problem
Persistent 500 Internal Server Error when:
1. Loading floor plans (`GET /api/events/[id]/floor-plan`)
2. Saving floor plans (`POST /api/events/[id]/floor-plan`)
3. Fetching tickets (`GET /api/events/[id]/tickets`)

## Root Causes Identified

### 1. **Enum Type Mismatch** (PRIMARY CAUSE)
- **Issue**: `FloorPlan.status` was defined as `FloorPlanStatus` enum in Prisma schema
- **Database Reality**: PostgreSQL table `floor_plans.status` is a `text` column
- **Error**: `type "public.FloorPlanStatus" does not exist`
- **Fix**: Changed `status` from enum to `String` type in schema.prisma (line 1513)

### 2. **BigInt/Decimal Serialization**
- **Issue**: `eventId` (BigInt) and price fields (Decimal) cannot be serialized by `JSON.stringify()`
- **Fix**: 
  - Added `BigInt.prototype.toJSON` in `lib/prisma.ts`
  - Implemented explicit field-by-field serialization in all API responses
  - Convert BigInt to String and Decimal to String/Number before JSON response

### 3. **Schema Misalignment**
- **Issue**: `Ticket` model was mapped to wrong table with incorrect field types
- **Fix**: 
  - Updated `Ticket` model to use `BigInt` for IDs
  - Mapped fields to snake_case database columns (`price_in_minor`, `quantity`)
  - Added `@@map("tickets")` to use legacy table

### 4. **AI-Generated ID Conflicts**
- **Issue**: AI floor plan generator creates mock IDs (`fp-12345...`)
- **Problem**: Frontend sends PUT with these IDs, but they don't exist in DB
- **Fix**: 
  - POST handler ignores mock IDs (lets DB generate real CUID)
  - PUT handler uses `upsert` to handle both create and update scenarios

## Files Modified

### Schema & Database
- `apps/web/prisma/schema.prisma`
  - Line 1513: `status String @default("DRAFT")` (was `FloorPlanStatus`)
  - Lines 378-411: Updated `Ticket` model with BigInt IDs and field mappings

### Core Libraries
- `apps/web/lib/prisma.ts`
  - Added `BigInt.prototype.toJSON` polyfill
  - Created `safeJson` helper function

- `apps/web/lib/promo.ts`
  - Fixed field names (`isActive` instead of `status`)
  - Updated to handle per-event unique promo codes

### API Routes
- `apps/web/app/api/events/[id]/floor-plan/route.ts`
  - Removed unused imports
  - Implemented explicit serialization in GET/POST/PUT
  - Added upsert logic to PUT handler
  - Added robust error handling and logging

- `apps/web/app/api/events/[id]/tickets/route.ts`
  - Updated to use BigInt for eventId
  - Explicit field serialization
  - Correct field name mapping

- `apps/web/app/api/events/[id]/tickets/[ticketId]/route.ts`
  - Updated PUT/DELETE to use BigInt
  - Explicit serialization

- `apps/web/app/api/events/[id]/ticket-groups/route.ts`
  - Applied safeJson to responses

### Diagnostic Tools (for debugging)
- `apps/web/app/api/events/[id]/floor-plan/debug/route.ts` (NEW)
  - Comprehensive diagnostic endpoint
  - Traces each step of floor plan creation
  - Returns detailed error information

## Deployment Checklist

✅ 1. Schema updated (`status` changed to String)
✅ 2. Prisma Client regenerated locally
✅ 3. All API routes updated with explicit serialization
✅ 4. BigInt polyfill added
✅ 5. Diagnostic endpoint created

⏳ 6. **REQUIRED**: Commit and push to trigger Vercel rebuild
⏳ 7. **REQUIRED**: Verify Vercel build includes `prisma generate`
⏳ 8. Test floor plan creation after deployment
⏳ 9. Test AI floor plan generation after deployment

## Testing After Deployment

### Test 1: Manual Floor Plan
1. Navigate to `/events/22/design/floor-plan`
2. Click "Save Floor Plan"
3. **Expected**: Success message, no 500 error

### Test 2: AI Floor Plan
1. Navigate to `/events/22/design/floor-plan`
2. Use AI Generator with prompt: "Create a wedding layout for 200 guests"
3. Click "Generate Floor Plan"
4. Click "Save Floor Plan"
5. **Expected**: Floor plan saves successfully

### Test 3: Tickets
1. Navigate to `/events/22/registrations/ticket-class`
2. **Expected**: Tickets load without 500 error

## Diagnostic Endpoint

If issues persist after deployment, use:
```
POST /api/events/22/floor-plan/debug
```

This will return detailed diagnostics showing exactly where the error occurs.

## Critical Notes

1. **Vercel Build**: The `postinstall` script in package.json runs `prisma generate` automatically
2. **Schema Changes**: Any schema.prisma changes require a full rebuild, not just a redeploy
3. **Type Safety**: TypeScript lint errors about `priceInMinor` etc. are due to cached Prisma types - they will resolve after rebuild
4. **Database**: No database migrations needed - we're using existing tables

## Rollback Plan

If issues persist:
1. Check Vercel build logs for `prisma generate` success
2. Use diagnostic endpoint to identify exact failure point
3. Verify DATABASE_URL is correctly set in Vercel environment variables
