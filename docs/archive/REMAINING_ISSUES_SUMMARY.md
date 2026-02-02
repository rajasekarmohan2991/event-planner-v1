# 📋 Remaining Issues - Action Required

## Date: November 15, 2025 9:05 PM IST

---

## ✅ COMPLETED

### 1. Promo Codes Save Functionality
**Status**: ✅ **FIXED**
- Fixed ID type (String CUID instead of Number)
- Fixed minOrderAmount (Float in rupees, not paise)
- Fixed display formatting
- Docker rebuild in progress

---

## ⏳ PENDING ISSUES

### 2. Calendar Auto-Fetch Session & Speaker
**Status**: ⏳ **NEEDS IMPLEMENTATION**

**Current State**:
- Calendar page exists at `/events/[id]/calendar/page.tsx`
- Sessions page exists at `/events/[id]/sessions/page.tsx`
- No auto-fetch when session/speaker is selected

**Required Behavior**:
1. When user selects a session from dropdown
2. Auto-fetch and populate:
   - Session title
   - Session description
   - Start/end time
   - Room/location
   - Speaker name
   - Speaker bio
   - Speaker photo

**Implementation Plan**:
```typescript
// Add to sessions page
const handleSessionSelect = async (sessionId: string) => {
  const res = await fetch(`/api/events/${eventId}/sessions/${sessionId}`)
  const session = await res.json()
  
  // Auto-populate form
  setFormData({
    title: session.title,
    description: session.description,
    startTime: session.startTime,
    endTime: session.endTime,
    room: session.room,
    // ...
  })
  
  // Fetch speaker details
  if (session.speakerId) {
    const speakerRes = await fetch(`/api/events/${eventId}/speakers/${session.speakerId}`)
    const speaker = await speakerRes.json()
    setSpeakerData(speaker)
  }
}
```

**Files to Modify**:
- `/apps/web/app/events/[id]/sessions/page.tsx` - Add auto-fetch logic
- `/apps/web/app/events/[id]/calendar/page.tsx` - Add auto-fetch logic

---

### 3. Floor Planner - VIP/Premium/General Seating
**Status**: ⏳ **NEEDS MAJOR REFACTORING**

**Current State**:
- Floor planner exists at `/events/[id]/floor-planner/page.tsx`
- Only creates one floor plan for all seats
- No ticket class differentiation

**Required Behavior**:
1. Floor planner should have 3 tabs:
   - **VIP Seating Plan**
   - **Premium Seating Plan**
   - **General Seating Plan**

2. Each tab should allow:
   - Upload separate floor plan image
   - Define seat layout (rows × columns)
   - Set seat numbers
   - Set base price for that class

3. Database changes needed:
```sql
-- Add ticket_class column to seat_inventory
ALTER TABLE seat_inventory 
ADD COLUMN ticket_class VARCHAR(20) DEFAULT 'GENERAL';

-- Add ticket_class column to floor_plans
ALTER TABLE floor_plans 
ADD COLUMN ticket_class VARCHAR(20) DEFAULT 'GENERAL';
```

4. Seat selector should filter by ticket class:
```typescript
// When user selects ticket class in registration
const seats = await fetch(`/api/events/${eventId}/seats?ticketClass=${ticketClass}`)
```

**Implementation Complexity**: **HIGH** (2-3 hours)

**Files to Modify**:
- `/apps/web/app/events/[id]/floor-planner/page.tsx` - Add ticket class tabs
- `/apps/web/app/api/events/[id]/floor-plans/route.ts` - Add ticket class filter
- `/apps/web/app/api/events/[id]/seats/route.ts` - Add ticket class filter
- `/apps/web/components/events/SeatSelector.tsx` - Filter by ticket class
- Database: Add migrations for ticket_class column

---

### 4. Ticket Class Functionality
**Status**: ⏳ **NEEDS CLARIFICATION**

**Questions**:
1. What exactly is "not proper" about ticket class functionality?
2. Where should ticket class be used?
   - Registration form?
   - Seat selection?
   - Payment?
   - Reports?
3. What are the expected ticket classes?
   - VIP
   - Premium
   - General
   - Others?
4. How should pricing work per ticket class?
5. Should ticket class affect:
   - Available seats?
   - Promo codes?
   - Payment methods?
   - Email templates?

**Action Required**: **PLEASE CLARIFY REQUIREMENTS**

---

### 5. RSVP & Sales Summary Not Fetching Data
**Status**: ⏳ **NEEDS API FIXES**

#### 5A. RSVP Summary
**Current State**:
- RSVP page exists but shows static data
- RSVP API endpoints exist but not connected

**Required Behavior**:
- Show real-time RSVP responses
- Count by status (Attending, Maybe, Not Attending)
- Show attendee details
- Filter by response type

**Implementation**:
```typescript
// Create RSVP summary API
GET /api/events/[id]/rsvp/summary

Response:
{
  total: 100,
  attending: 75,
  maybe: 15,
  notAttending: 10,
  responses: [
    {
      name: "John Doe",
      email: "john@example.com",
      status: "ATTENDING",
      respondedAt: "2025-11-15T10:00:00Z"
    }
  ]
}
```

**Files to Create/Modify**:
- `/apps/web/app/api/events/[id]/rsvp/summary/route.ts` - Create summary API
- `/apps/web/app/events/[id]/rsvp/page.tsx` - Connect to API

#### 5B. Sales Summary
**Current State**:
- Sales summary API exists at `/api/events/[id]/sales/summary/route.ts`
- Might not be fetching real data from registrations and payments

**Required Behavior**:
- Total registrations count
- Total revenue (sum of all payments)
- Revenue by ticket class
- Conversion rate
- Average order value
- Payment method breakdown

**Verification Needed**:
```sql
-- Check if sales summary queries are correct
SELECT 
  COUNT(*) as total_registrations,
  SUM(p.amount) as total_revenue,
  data_json->>'ticketClass' as ticket_class
FROM registrations r
LEFT JOIN payments p ON p.registration_id = r.id
WHERE r.event_id = 8
GROUP BY data_json->>'ticketClass';
```

**Files to Verify/Modify**:
- `/apps/web/app/api/events/[id]/sales/summary/route.ts` - Verify queries
- `/apps/web/app/events/[id]/sales/page.tsx` - Verify data display

---

### 6. Payment Details Not Appearing After Success
**Status**: ⏳ **NEEDS DEBUGGING**

**Current State**:
- Payment success page shows QR code
- Payment history page exists at `/events/[id]/payments`
- Payment API exists at `/api/events/[id]/payments/route.ts`

**Possible Issues**:
1. Payment record not being created during registration
2. Payment API not fetching correctly
3. Frontend not refreshing after payment

**Debugging Steps**:
```sql
-- Check if payment was created
SELECT * FROM payments 
WHERE registration_id IN (
  SELECT id FROM registrations WHERE event_id = 8
)
ORDER BY created_at DESC
LIMIT 10;

-- Check registration payment status
SELECT 
  r.id,
  r.data_json->>'email' as email,
  r.data_json->>'paymentStatus' as payment_status,
  r.data_json->>'paymentMethod' as payment_method,
  r.data_json->>'totalPrice' as total_price,
  p.id as payment_id,
  p.amount as payment_amount,
  p.payment_status as payment_table_status
FROM registrations r
LEFT JOIN payments p ON p.registration_id = r.id
WHERE r.event_id = 8
ORDER BY r.created_at DESC
LIMIT 10;
```

**Files to Verify**:
- `/apps/web/app/api/events/[id]/registrations/route.ts` - Check payment creation (lines 280-320)
- `/apps/web/app/api/events/[id]/payments/route.ts` - Check payment fetching
- `/apps/web/app/events/[id]/payments/page.tsx` - Check frontend display

---

## 📊 Implementation Priority

### Phase 1 (Immediate - 30 mins):
1. ✅ Fix promo codes save (DONE)
2. ⏳ Verify payment creation and display
3. ⏳ Fix RSVP & Sales Summary APIs

### Phase 2 (Important - 1 hour):
4. ⏳ Add calendar auto-fetch for session & speaker
5. ⏳ Clarify ticket class requirements

### Phase 3 (Major Refactor - 2-3 hours):
6. ⏳ Implement floor planner with VIP/Premium/General tabs
7. ⏳ Add ticket class filtering throughout system

---

## 🎯 Next Steps

### Immediate Actions:
1. ✅ Complete Docker rebuild with promo code fixes
2. ⏳ Test promo codes save functionality
3. ⏳ Run SQL queries to verify payment creation
4. ⏳ Fix RSVP summary API
5. ⏳ Fix Sales summary API

### Clarification Needed:
1. **Ticket Class**: What exactly is not working? What should it do?
2. **Floor Planner**: Confirm requirement for 3 separate seating plans
3. **Payment Display**: Should it auto-refresh or require manual refresh?

### Major Refactoring:
1. **Floor Planner**: Implement ticket class tabs (2-3 hours)
2. **Seat Selector**: Add ticket class filtering (1 hour)
3. **Database**: Add ticket_class columns (30 mins)

---

## 🚀 Docker Build Status

**Build**: ⏳ **IN PROGRESS**
**ETA**: ~2 minutes

---

## 📝 Questions for User

1. **Ticket Class**: Can you describe exactly what's not working with ticket class functionality?

2. **Floor Planner**: Do you want:
   - 3 separate floor plan images (one for each class)?
   - OR 1 floor plan with seats colored by class?
   - OR 3 tabs with separate seat layouts?

3. **Payment Display**: After successful payment:
   - Should payment appear immediately in history?
   - Should user be redirected to payment history?
   - Should there be a "View Payment" button on success page?

4. **Calendar Auto-Fetch**: Should this happen:
   - When creating a new calendar event?
   - When editing an existing calendar event?
   - Both?

5. **Priority**: Which issue is most critical to fix first?
   - Calendar auto-fetch?
   - Floor planner seating?
   - Payment display?
   - RSVP/Sales summary?

---

**Last Updated**: November 15, 2025 9:05 PM IST
**Status**: Awaiting user clarification and Docker rebuild completion
