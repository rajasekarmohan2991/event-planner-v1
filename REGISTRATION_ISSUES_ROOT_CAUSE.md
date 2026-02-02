# Registration Issues - Root Cause Analysis

## Current Status (as of 2026-01-19 18:19)

### Issue 1: Registration Still Failing
**Error**: Prisma P2010 - "You will need to rewrite or cast the expression"

**Root Cause**: JSONB type casting missing in PostgreSQL raw queries

**Fixes Applied**:
1. ✅ Line 401: Added `::jsonb` cast to `registrationDataJson`
2. ✅ Line 426: Added `::jsonb` cast to `metaJson`

**Status**: Fixed in code, awaiting deployment

---

### Issue 2: Seat Selector Not Showing

**Expected Behavior**:
- If event has seats → Show banner "Reserved Seating Event"
- After form submission → Redirect to `/events/[id]/register-with-seats`

**Current Implementation** (lines 76-117):
```typescript
// Check if event has seat selection available
useEffect(() => {
  const checkSeats = async () => {
    try {
      const res = await fetch(`/api/events/${params.id}/seats/availability`)
      if (res.ok) {
        const data = await res.json()
        
        // If no seats but floor plan exists, trigger generation
        if (data.totalSeats === 0 && data.floorPlan) {
          // Auto-generate seats
          await fetch(`/api/events/${params.id}/seats/generate`, { method: 'POST' })
          // Re-check
        }
        
        setHasSeats(data.totalSeats > 0)
      }
    } catch (error) {
      console.log('No seats available for this event')
    } finally {
      setCheckingSeats(false)
    }
  }
  checkSeats()
}, [params.id])
```

**Possible Root Causes**:

1. **API `/api/events/[id]/seats/availability` is failing**
   - Returns 404/500
   - Returns `{ totalSeats: 0 }` even when seats exist
   
2. **Floor plan exists but seats not generated**
   - Auto-generation failing silently
   - `/api/events/[id]/seats/generate` endpoint missing or broken

3. **State not updating**
   - `hasSeats` stays `false` even after successful check
   - `checkingSeats` never completes

---

### Issue 3: Registration Taking Too Long

**Fixes Applied**:
1. ✅ Removed `ensureSchema()` call (was adding 2-3s delay)
2. ✅ Made QR code generation async (was blocking 200-500ms)
3. ✅ Made email sending async

**Expected Result**: Registration should complete in ~500ms-1s

---

## Debugging Steps Required

### For Seat Selector Issue:
1. Check if `/api/events/[id]/seats/availability` endpoint exists
2. Check if it returns correct data structure
3. Check browser console for errors during seat check
4. Verify floor plan exists in database
5. Check if `/api/events/[id]/seats/generate` works

### For Registration Failure:
1. Wait for deployment to complete (JSONB fixes)
2. Check server logs for actual error
3. Verify all required fields are being sent
4. Check if database tables exist

---

## Next Actions

**Immediate**:
1. Push JSONB fixes to production
2. Check `/api/events/38/seats/availability` endpoint
3. Get actual error from server logs

**If Still Failing**:
1. Add more detailed logging to registration API
2. Check database schema for `registrations` and `Order` tables
3. Verify JSONB column types in PostgreSQL

---

## Data Flow

### Registration Without Seats:
```
User fills form
  ↓
Submit button clicked
  ↓
POST /api/events/[id]/registrations
  ↓
{
  type: 'GENERAL',
  data: {
    firstName, lastName, email,
    totalPrice, promoCode, ...
  }
}
  ↓
API validates → Inserts to DB → Returns success
  ↓
Redirect to payment or success page
```

### Registration With Seats:
```
User fills form
  ↓
Submit button clicked
  ↓
Save form data to localStorage
  ↓
Redirect to /events/[id]/register-with-seats
  ↓
User selects seats
  ↓
POST /api/events/[id]/registrations (with seat IDs)
```

---

## Required Information from User

To properly diagnose, I need:

1. **Browser console logs** - What errors appear when:
   - Page loads
   - Form is submitted
   
2. **Network tab** - Check these requests:
   - `/api/events/38/seats/availability` - What does it return?
   - `/api/events/38/registrations` - What's the actual error response?
   
3. **Server logs** (if accessible) - What error occurs on the backend?

4. **Event #38 details**:
   - Does it have a floor plan?
   - Does it have ticket classes?
   - What's the event mode (IN_PERSON/VIRTUAL/HYBRID)?
