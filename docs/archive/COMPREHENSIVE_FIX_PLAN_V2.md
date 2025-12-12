# 🔧 Comprehensive Fix Plan - All Critical Issues

## Date: November 15, 2025 8:50 PM IST

---

## 📋 Issues to Fix

### 1. ❌ Promo Codes Not Saving
**Problem**: Promo codes fail to save successfully
**Root Causes**:
- PromoCode model uses `String` ID (CUID) but API converts to `Number`
- `minOrderAmount` conversion mismatch (rupees vs paise)
- Type mismatch between frontend and backend

### 2. ❌ Calendar Not Auto-Fetching Session & Speaker
**Problem**: Calendar doesn't auto-fetch session details and speaker info when selected
**Root Cause**: Missing auto-fetch logic when session/speaker is selected

### 3. ❌ Floor Planner Not Asking for Seating Plans
**Problem**: Floor planner doesn't ask for VIP, Premium, and General seating plans
**Root Cause**: Floor planner needs separate configuration for each ticket class

### 4. ❌ Ticket Class Functionality Not Proper
**Problem**: Ticket class functionality not working based on requirements
**Root Cause**: Need to clarify ticket class requirements and implementation

### 5. ❌ RSVP & Sales Summary Not Fetching Data
**Problem**: RSVP and Sales Summary not fetching based on registration and payment
**Root Cause**: Missing data aggregation queries

### 6. ❌ Payment Details Not Appearing After Success
**Problem**: After successful payment, details don't appear in payment history
**Root Cause**: Payment record creation might be failing or not being fetched

---

## 🔧 Fix #1: Promo Codes Save Issue

### Problem Analysis:
```typescript
// Prisma Schema - PromoCode uses String ID
model PromoCode {
  id String @id @default(cuid())  // ❌ CUID string
}

// API Response - Converting to Number
return NextResponse.json({
  id: Number(created.id),  // ❌ Can't convert CUID to Number
})

// Frontend Form - minOrderAmount conversion
minOrderAmount: (parseInt(e.target.value) || 0) * 100  // Converts to paise
// But API expects rupees as Float
```

### Solution:
1. Keep PromoCode ID as String (don't convert to Number)
2. Fix minOrderAmount to use Float directly
3. Update frontend to match backend expectations

### Files to Modify:
- `/apps/web/app/api/events/[id]/promo-codes/route.ts` - Keep ID as String
- `/apps/web/app/events/[id]/registrations/promo-codes/page.tsx` - Fix minOrderAmount

---

## 🔧 Fix #2: Calendar Auto-Fetch Session & Speaker

### Current State:
Calendar page exists but doesn't auto-populate session details when selected

### Required Behavior:
1. When user selects a session from dropdown
2. Auto-fetch and display:
   - Session title
   - Session description
   - Session time
   - Speaker name
   - Speaker bio
   - Speaker photo

### Implementation:
- Add `onChange` handler to session selector
- Fetch session details from `/api/events/[id]/sessions/[sessionId]`
- Fetch speaker details from `/api/events/[id]/speakers/[speakerId]`
- Auto-populate form fields

### Files to Modify:
- `/apps/web/app/events/[id]/calendar/page.tsx` - Add auto-fetch logic
- Create `/apps/web/app/api/events/[id]/sessions/[sessionId]/route.ts` if missing

---

## 🔧 Fix #3: Floor Planner Seating Configuration

### Current State:
Floor planner doesn't ask for separate seating plans for each ticket class

### Required Behavior:
1. Floor planner should have 3 tabs/sections:
   - **VIP Seating Plan**
   - **Premium Seating Plan**
   - **General Seating Plan**
2. Each section should allow:
   - Upload floor plan image
   - Define seat layout (rows, columns)
   - Set seat numbers
   - Set pricing for that class
3. Seat selector should show only seats for selected ticket class

### Implementation:
- Modify floor planner to have ticket class selector
- Save separate floor plans for each class in database
- Link seats to ticket classes
- Filter seats in seat selector by ticket class

### Files to Modify:
- `/apps/web/app/events/[id]/floor-planner/page.tsx` - Add ticket class tabs
- Database: Add `ticketClass` field to `seat_inventory` table
- `/apps/web/components/events/SeatSelector.tsx` - Filter by ticket class

---

## 🔧 Fix #4: Ticket Class Functionality

### Current Issues:
Need clarification on what "ticket class functionality not proper" means

### Possible Issues:
1. Ticket classes not linked to seats properly
2. Pricing not working per ticket class
3. Registration not respecting ticket class selection
4. Ticket class not appearing in registration details

### Required Information:
- What should ticket class functionality do?
- How should it work in registration flow?
- How should it appear in reports?

---

## 🔧 Fix #5: RSVP & Sales Summary Data Fetching

### Current State:
RSVP and Sales Summary pages not showing real-time data

### Required Behavior:

#### RSVP Page:
- Show all RSVP responses (Attending, Maybe, Not Attending)
- Count by status
- Show attendee details
- Filter by response type

#### Sales Summary:
- Total registrations count
- Total revenue (sum of all payments)
- Revenue by ticket class (VIP, Premium, General)
- Conversion rate (registrations / views)
- Average order value
- Payment method breakdown

### Implementation:

#### RSVP API:
```sql
SELECT 
  status,
  COUNT(*) as count,
  array_agg(json_build_object(
    'name', name,
    'email', email,
    'respondedAt', responded_at
  )) as responses
FROM rsvp_responses
WHERE event_id = $1
GROUP BY status
```

#### Sales Summary API:
```sql
-- Total registrations
SELECT COUNT(*) FROM registrations WHERE event_id = $1

-- Total revenue
SELECT SUM(amount) FROM payments 
WHERE registration_id IN (
  SELECT id FROM registrations WHERE event_id = $1
)

-- Revenue by ticket class
SELECT 
  data_json->>'ticketClass' as ticket_class,
  COUNT(*) as count,
  SUM(p.amount) as revenue
FROM registrations r
JOIN payments p ON p.registration_id = r.id
WHERE r.event_id = $1
GROUP BY data_json->>'ticketClass'
```

### Files to Create/Modify:
- `/apps/web/app/api/events/[id]/rsvp/summary/route.ts` - RSVP summary API
- `/apps/web/app/api/events/[id]/sales/summary/route.ts` - Already exists, verify queries
- `/apps/web/app/events/[id]/rsvp/page.tsx` - Update to fetch real data
- `/apps/web/app/events/[id]/sales/page.tsx` - Update to fetch real data

---

## 🔧 Fix #6: Payment Details After Successful Payment

### Current State:
After successful payment, details don't appear in payment history

### Debugging Steps:
1. Check if payment record is created in database
2. Check if payment API is fetching correctly
3. Check if frontend is displaying correctly

### Verification Queries:
```sql
-- Check if payment was created
SELECT * FROM payments 
WHERE registration_id IN (
  SELECT id FROM registrations WHERE event_id = 8
)
ORDER BY created_at DESC
LIMIT 10;

-- Check registration with payment
SELECT 
  r.id,
  r.data_json->>'email' as email,
  r.data_json->>'paymentStatus' as payment_status,
  p.amount,
  p.payment_status
FROM registrations r
LEFT JOIN payments p ON p.registration_id = r.id
WHERE r.event_id = 8
ORDER BY r.created_at DESC
LIMIT 10;
```

### Possible Issues:
1. Payment record not being created in POST /api/events/[id]/registrations
2. Payment API not fetching correctly
3. Frontend not refreshing after payment

### Solution:
- Verify payment creation in registration API
- Add logging to track payment creation
- Ensure payment API returns correct data
- Add auto-refresh on payment success page

---

## 📝 Implementation Priority

### Phase 1 (Critical - 30 mins):
1. ✅ Fix promo codes save (ID type mismatch)
2. ✅ Fix payment details display
3. ✅ Fix RSVP & Sales Summary data fetching

### Phase 2 (Important - 1 hour):
4. ✅ Add calendar auto-fetch for session & speaker
5. ✅ Fix floor planner for VIP/Premium/General seating

### Phase 3 (Enhancement - 30 mins):
6. ✅ Clarify and fix ticket class functionality
7. ✅ Test all fixes end-to-end
8. ✅ Rebuild Docker

---

## 🧪 Testing Checklist

### Promo Codes:
- [ ] Create new promo code with all fields
- [ ] Verify it saves successfully
- [ ] Verify it appears in list
- [ ] Apply promo code in registration
- [ ] Verify discount is calculated correctly

### Calendar:
- [ ] Select session from dropdown
- [ ] Verify session details auto-populate
- [ ] Verify speaker details auto-populate
- [ ] Save calendar event
- [ ] Verify it appears in calendar view

### Floor Planner:
- [ ] Open floor planner
- [ ] See VIP/Premium/General tabs
- [ ] Upload floor plan for each class
- [ ] Define seats for each class
- [ ] Verify seats appear in seat selector
- [ ] Verify seat selector filters by ticket class

### RSVP:
- [ ] Send RSVP invitations
- [ ] Respond to RSVP (Attending/Maybe/Not Attending)
- [ ] Verify responses appear in RSVP page
- [ ] Verify counts are correct

### Sales Summary:
- [ ] Complete registration with payment
- [ ] Verify registration count increases
- [ ] Verify revenue updates
- [ ] Verify ticket class breakdown
- [ ] Verify payment method breakdown

### Payment:
- [ ] Complete registration with dummy payment
- [ ] Verify payment success page shows details
- [ ] Navigate to payment history
- [ ] Verify payment appears in list
- [ ] Verify amount and status are correct

---

## 🚀 Next Steps

1. **Immediate**: Fix promo codes ID type issue
2. **Immediate**: Verify payment creation and display
3. **Next**: Implement calendar auto-fetch
4. **Next**: Implement floor planner ticket class tabs
5. **Next**: Fix RSVP and Sales Summary queries
6. **Final**: Test everything and rebuild Docker

---

**Status**: 📋 **PLAN READY - AWAITING EXECUTION**
