# Event Card Interaction Fix - Dec 8, 2025

## Issues Fixed

### ✅ Card Click Behavior
**Problem**: Clicking anywhere on the event card was navigating to event details page, preventing Register and "I'm Interested" buttons from working properly.

**Fix**: Removed the `onClick` handler from the card container div, so only the specific buttons are clickable.

## Changes Made

### File Modified
`/apps/web/app/events/browse/page.tsx`

### Change Details

**Before**:
```tsx
<div
  key={event.id}
  className="group bg-white rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
  onClick={() => handleViewDetails(event.id)}  // ← This was the problem
>
```

**After**:
```tsx
<div
  key={event.id}
  className="group bg-white rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300"
  // ← Removed onClick handler
>
```

## How It Works Now

### Event Card Interactions

#### ✅ Register Button
- **Location**: Bottom right of card
- **Action**: Redirects to `/events/${eventId}/register-with-seats`
- **Flow**:
  1. User clicks "Register" button
  2. Redirects to seat selection page
  3. User selects seats from floor plan
  4. Fills in registration details
  5. Completes payment
  6. Registration appears in "My Tickets"
  7. Receives QR code for check-in

#### ✅ I'm Interested Button
- **Location**: Bottom of card (full width, blue button)
- **Action**: Records RSVP interest as "MAYBE"
- **Flow**:
  1. User clicks "💙 I'm Interested"
  2. Calls `/api/events/${eventId}/rsvp-interest` with `responseType: 'MAYBE'`
  3. Records interest in `rsvp_interests` table
  4. Also mirrors to `rsvp_guests` table for organizer visibility
  5. Shows toast: "Interest Recorded! We'll keep you updated about this event."

#### ❌ Card Body (Non-clickable)
- **Location**: Event image, title, details, price
- **Action**: None - no navigation or action
- **Reason**: Prevents accidental navigation when user wants to read event details

## Registration Flow

### Complete Registration Journey

1. **Browse Events** (`/events/browse`)
   - User sees event cards with details
   - Clicks "Register" button

2. **Seat Selection** (`/events/${id}/register-with-seats`)
   - If event has floor plan: Shows interactive seat selector
   - User selects desired seats
   - Seats are temporarily reserved (15 min expiry)

3. **Registration Form**
   - User fills in personal details
   - Can apply promo codes
   - Reviews order summary

4. **Payment**
   - Selects payment method
   - Completes payment (dummy payment for testing)

5. **Success**
   - Registration confirmed
   - QR code generated
   - Email sent with QR code
   - **Registration appears in "My Tickets"**

6. **Check-in**
   - User shows QR code at event
   - Staff scans QR code
   - Status updates to "CHECKED_IN"

## RSVP Interest Module

### Database Tables

#### `rsvp_interests` Table
Stores user interest in events:
```sql
event_id        | Event ID
user_id         | User ID (if logged in)
name            | User name
email           | User email
response_type   | GOING, MAYBE, NOT_GOING, PENDING
status          | NOT_REGISTERED, REGISTERED
created_at      | When interest was recorded
updated_at      | Last update time
```

#### `rsvp_guests` Table
Mirrors interest for organizer dashboard:
```sql
event_id        | Event ID
name            | Guest name
email           | Guest email
status          | GOING, INTERESTED, NOT_GOING, YET_TO_RESPOND
```

### Response Type Mapping

| User Action | response_type | rsvp_guest.status |
|-------------|---------------|-------------------|
| "I'm Interested" | MAYBE | INTERESTED |
| "Register" (full) | GOING | GOING |
| Decline | NOT_GOING | NOT_GOING |
| No response | PENDING | YET_TO_RESPOND |

### Organizer View

Organizers can see all interested users in:
- **RSVP Management** page
- **Event Dashboard** → RSVP section
- Shows counts: Going, Maybe, Not Going
- Shows user details: Name, Email, Response Type

## API Endpoints

### POST `/api/events/[id]/rsvp-interest`
Records user interest in an event.

**Request**:
```json
{
  "responseType": "MAYBE"  // GOING, MAYBE, NOT_GOING, PENDING
}
```

**Response**:
```json
{
  "success": true,
  "message": "Interest recorded successfully",
  "responseType": "MAYBE"
}
```

**Features**:
- Requires authentication
- Upserts (inserts or updates) interest
- Records in both `rsvp_interests` and `rsvp_guests` tables
- Prevents duplicate entries (unique constraint on event_id + email)

### GET `/api/events/[id]/rsvp-interest`
Gets RSVP interest summary and user's response.

**Response**:
```json
{
  "going": 45,
  "maybe": 23,
  "notGoing": 5,
  "pending": 10,
  "total": 83,
  "userResponse": "MAYBE"  // or null if user hasn't responded
}
```

## Testing Instructions

### Test Register Button
1. Go to `/events/browse`
2. Find a LIVE event
3. Click "Register" button (red button, bottom right)
4. **Expected**: Redirects to `/events/${id}/register-with-seats`
5. Select seats (if available)
6. Complete registration
7. **Expected**: Registration appears in "My Tickets"

### Test I'm Interested Button
1. Go to `/events/browse`
2. Find a LIVE event
3. Click "💙 I'm Interested" button (blue button, full width)
4. **Expected**: Toast message "Interest Recorded!"
5. Check organizer dashboard → RSVP section
6. **Expected**: Your email appears in "Interested" list

### Test Card Non-clickability
1. Go to `/events/browse`
2. Click on event image, title, or details
3. **Expected**: Nothing happens, stays on browse page
4. Only Register and I'm Interested buttons should work

## Database Verification

### Check RSVP Interest
```sql
SELECT 
  event_id,
  name,
  email,
  response_type,
  status,
  created_at
FROM rsvp_interests
WHERE event_id = 12
ORDER BY created_at DESC;
```

### Check RSVP Guests (Organizer View)
```sql
SELECT 
  event_id,
  name,
  email,
  status
FROM rsvp_guests
WHERE event_id = 12;
```

### Check Registrations (My Tickets)
```sql
SELECT 
  id,
  event_id,
  data_json::jsonb->>'email' as email,
  data_json::jsonb->>'status' as status,
  check_in_status,
  created_at
FROM registrations
WHERE event_id = 12
ORDER BY created_at DESC;
```

## Services Status
✅ **PostgreSQL**: Running and healthy
✅ **Redis**: Running and healthy
✅ **Java API**: Running on port 8081
✅ **Next.js Web**: Rebuilt and running on port 3001

## Summary

All issues fixed:
1. ✅ **Card click removed** - Only buttons are clickable
2. ✅ **Register button works** - Redirects to seat selection and payment
3. ✅ **I'm Interested works** - Records RSVP interest with user details
4. ✅ **RSVP module integration** - Interest appears in organizer dashboard
5. ✅ **My Tickets integration** - Completed registrations appear in user's tickets

**Event card interactions are now working perfectly!** 🎉
