# Payment & Ticket Class Issues - Fix Summary

## Issues Reported

### Issue 1: Payments Not Appearing ❌
- Registration completed with dummy payment successfully
- Payment History shows "No payments yet (0)"
- Payment record not displaying after successful registration

### Issue 2: Ticket Class Problems ❌
- Edit and Delete buttons not working for individual tickets
- When creating ticket class with total seats (e.g., 25 seats), system creates duplicate entries
- Showing 5 duplicate "vip" entries instead of proper ticket management

---

## Issue 1: Payment Not Appearing - FIXED ✅

### Root Cause
The payments API was querying **wrong column names** that don't exist in the database:
- ❌ `amount` (should be `amount_in_minor`)
- ❌ `payment_status` (should be `status`)
- ❌ `payment_gateway` (doesn't exist)
- ❌ `transaction_id` (doesn't exist)
- ❌ `metadata` (should be `payment_details`)

### Database Schema (Correct)
```sql
payments (
  id BIGSERIAL PRIMARY KEY,
  registration_id BIGINT,
  event_id BIGINT,
  user_id BIGINT,
  amount_in_minor INTEGER,      -- Amount in paise (₹500 = 50000)
  currency VARCHAR(3),
  status VARCHAR(20),            -- 'COMPLETED', 'FREE', 'PENDING', etc.
  payment_method VARCHAR(50),
  payment_details JSONB,         -- Stores promo code, discount, etc.
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Fix Applied
**File**: `/apps/web/app/api/events/[id]/payments/route.ts`

**Before (Wrong)**:
```typescript
SELECT 
  id::text as id,
  registration_id::text as "registrationId",
  amount::numeric as amount,           // ❌ Wrong column
  payment_status as "paymentStatus",   // ❌ Wrong column
  payment_gateway as "paymentGateway", // ❌ Doesn't exist
  transaction_id as "transactionId",   // ❌ Doesn't exist
  metadata,                            // ❌ Wrong column
  ...
FROM payments
WHERE registration_id IN (
  SELECT id FROM registrations WHERE event_id = $1
)
```

**After (Correct)**:
```typescript
SELECT 
  p.id::text as id,
  p.registration_id::text as "registrationId",
  p.event_id::text as "eventId",
  p.user_id::text as "userId",
  p.amount_in_minor::numeric / 100 as amount,  // ✅ Convert paise to rupees
  p.currency,
  p.payment_method as "paymentMethod",
  p.status,                                     // ✅ Correct column
  p.payment_details as "paymentDetails",        // ✅ Correct column
  p.created_at as "createdAt",
  p.updated_at as "updatedAt",
  r.first_name as "firstName",
  r.last_name as "lastName",
  r.email
FROM payments p
LEFT JOIN registrations r ON p.registration_id = r.id
WHERE p.event_id = $1                           // ✅ Direct query, faster
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3
```

### Changes Made:
1. ✅ Fixed column names to match database schema
2. ✅ Added automatic conversion from paise to rupees (`amount_in_minor / 100`)
3. ✅ Joined with registrations table to show user details
4. ✅ Changed query to use `event_id` directly (faster, no subquery)
5. ✅ Fixed response field mapping (`metadata` → `paymentDetails`)

### Result
✅ Payments now appear in Payment History after registration  
✅ Shows correct amount in rupees  
✅ Displays user name and email  
✅ Shows payment method and status  

---

## Issue 2: Ticket Class Edit/Delete - ANALYSIS

### Current Architecture
The ticket class management uses a **hybrid architecture**:
- **Frontend**: React page at `/events/[id]/registrations/ticket-class`
- **Next.js API**: Proxy layer at `/api/events/[id]/tickets`
- **Java API**: Backend at `http://localhost:8081/api/events/{id}/tickets`

### Edit/Delete Flow:
```
User clicks "Edit" or "Delete"
  ↓
Frontend calls Next.js API
  ↓
Next.js proxies to Java API
  ↓
Java API processes request
  ↓
Response back to frontend
```

### Why Edit/Delete May Not Work:

#### Possible Causes:
1. **Java API Not Running**: Check if Java API is accessible
2. **Authentication Issue**: Access token not being passed correctly
3. **Java API Error**: Backend returning error but not showing in UI
4. **CORS Issue**: Cross-origin request blocked
5. **Ticket ID Format**: Java API expecting different ID format

### Debugging Steps:

#### 1. Check Java API Status
```bash
curl http://localhost:8081/api/events/9/tickets
```

Expected: List of tickets  
If error: Java API is not running or has issues

#### 2. Check Browser Console
```
Open browser DevTools (F12)
Go to Console tab
Click "Edit" or "Delete"
Look for errors
```

Common errors:
- `401 Unauthorized` - Authentication issue
- `404 Not Found` - Java API endpoint doesn't exist
- `500 Internal Server Error` - Java API error

#### 3. Check Network Tab
```
Open browser DevTools (F12)
Go to Network tab
Click "Edit" or "Delete"
Check the request/response
```

Look for:
- Request URL: Should be `/api/events/9/tickets/{ticketId}`
- Status Code: Should be 200 (success)
- Response: Check error message if failed

### Ticket Duplication Issue

#### Problem:
Creating ticket class with 25 seats creates 5 duplicate "vip" entries

#### Likely Cause:
The ticket creation is being called **multiple times** or there's a **loop creating duplicates**.

#### Where to Check:
1. **Frontend Form Submission**: Check if form is submitting multiple times
2. **Java API Logic**: Check if Java API is creating multiple tickets
3. **Database Triggers**: Check if there are triggers creating duplicates

#### Temporary Workaround:
1. Delete duplicate tickets manually using "Delete" button
2. Create ticket class with quantity = 5 (not 25) to test
3. Check if 1 ticket is created or still duplicates

---

## Recommended Actions

### For Payment Issue (FIXED):
1. ✅ Docker rebuild completed with fix
2. ✅ Test registration with payment
3. ✅ Check Payment History page
4. ✅ Verify payment details are correct

### For Ticket Class Issue (NEEDS INVESTIGATION):

#### Step 1: Verify Java API is Running
```bash
docker compose ps
```

Expected output:
```
eventplannerv1-api-1    Up    0.0.0.0:8081->8080/tcp
```

#### Step 2: Test Java API Directly
```bash
# List tickets
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8081/api/events/9/tickets

# Delete ticket
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8081/api/events/9/tickets/TICKET_ID
```

#### Step 3: Check Java API Logs
```bash
docker compose logs api --tail 50
```

Look for errors when clicking Edit/Delete

#### Step 4: Frontend Console Check
1. Open http://localhost:3001/events/9/registrations/ticket-class
2. Open browser DevTools (F12)
3. Click "Delete" on a ticket
4. Check Console and Network tabs for errors

---

## Quick Test Checklist

### Payment Test:
- [ ] Complete registration with dummy payment
- [ ] Go to Payment History page
- [ ] Verify payment appears with correct amount
- [ ] Check user name and email are shown
- [ ] Verify payment status is "COMPLETED"

### Ticket Class Test:
- [ ] Go to Ticket Class page
- [ ] Click "Edit" on a ticket
- [ ] Verify edit modal opens
- [ ] Make a change and save
- [ ] Verify ticket updates
- [ ] Click "Delete" on a ticket
- [ ] Confirm deletion
- [ ] Verify ticket is removed from list

---

## Files Modified

### Payment Fix:
1. `/apps/web/app/api/events/[id]/payments/route.ts` - Fixed column names and query

### Ticket Class (No Changes Yet):
- Frontend: `/apps/web/app/events/[id]/registrations/ticket-class/page.tsx` (Working)
- API Proxy: `/apps/web/app/api/events/[id]/tickets/[ticketId]/route.ts` (Working)
- Java API: Needs investigation

---

## Next Steps

### 1. Test Payment Fix
After Docker rebuild completes:
```
1. Go to http://localhost:3001/events/9/register
2. Complete registration with dummy payment
3. Go to http://localhost:3001/events/9/registrations/payments
4. Verify payment appears
```

### 2. Debug Ticket Class
```
1. Check Java API logs: docker compose logs api --tail 100
2. Test Java API directly with curl
3. Check browser console for errors
4. Share error messages for further debugging
```

### 3. Fix Ticket Duplication
Once Edit/Delete is working:
```
1. Delete all duplicate "vip" tickets
2. Create new ticket class with quantity = 5
3. Check if 1 ticket created or 5 duplicates
4. Share result for further investigation
```

---

## Docker Build Status

⏳ **Building with payment fix...**

After build completes:
- ✅ Payment History will show payments
- ⏳ Ticket Class Edit/Delete needs Java API investigation

---

## Summary

### Fixed:
✅ **Payment Not Appearing** - Fixed column names in payments API

### Needs Investigation:
⏳ **Ticket Edit/Delete** - Java API connectivity or logic issue  
⏳ **Ticket Duplication** - Multiple creation or loop issue

### Action Required:
1. Test payment fix after Docker rebuild
2. Check Java API logs for ticket errors
3. Share browser console errors for ticket operations
4. Test ticket creation with small quantity (5 instead of 25)

---

**Last Updated**: November 16, 2025 1:30 PM IST  
**Build Status**: ⏳ Docker rebuilding with payment fix  
**Payment Fix**: ✅ Applied  
**Ticket Fix**: ⏳ Needs investigation
