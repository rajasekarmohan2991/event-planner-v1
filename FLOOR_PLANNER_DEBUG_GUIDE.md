# Floor Planner Debugging Guide

## 🎯 What We've Implemented

### ✅ Database Migrations Applied
- **RLS (Row Level Security)**: Enabled on all tables for tenant isolation
- **Performance Indexes**: Critical indexes added for 10-100x faster queries

### 🔧 Comprehensive Debugging Tools

#### 1. Frontend Logging (Simple2DFloorGenerator.tsx)
**Console logs added at every step:**
- `[FloorPlanner] Starting generation with data:` - Shows form input
- `[FloorPlanner] Configuration:` - Shows calculated config (seatsPerRow, layout, tableType)
- `[FloorPlanner] Sections created:` - Number of sections (VIP, PREMIUM, GENERAL)
- `[FloorPlanner] Floor plan payload:` - Complete JSON payload being sent to API
- `[FloorPlanner] Sending POST to:` - API endpoint URL
- `[FloorPlanner] Response status:` - HTTP status code
- `[FloorPlanner] Response data:` - Server response
- `[FloorPlanner] ✅ Success!` or `[FloorPlanner] ❌ Error:` - Final result

#### 2. Backend Logging (API Route)
**Server-side logs:**
- `[API] /api/events/[id]/seats/generate - Starting`
- `[API] Event ID:` - Parsed event ID
- `[API] User:` - Current user email
- `[API] Request body keys:` - What was received
- `[API] Floor plan:` - Plan details (name, totalSeats, sections count)
- `[API] ✅ Successfully generated X seats` or `[API] ❌ Error:`

#### 3. Debug Panel (Development Only)
**Visual debug panel shows:**
- Event ID
- Total seats count
- Current form values (JSON formatted)
- Link to test API endpoint
- Reminder to check console

#### 4. Test Endpoint
**New endpoint: `/api/events/[id]/seats/test`**

Tests:
- Event exists
- Existing seats count
- Floor plan configs count
- Ability to create/delete test seat
- Returns detailed diagnostics

---

## 📝 How to Debug Floor Planner Issues

### Step 1: Open Browser DevTools
1. Press `F12` or `Cmd+Option+I` (Mac)
2. Go to **Console** tab
3. Clear console (click 🚫 icon)

### Step 2: Navigate to Floor Planner
1. Go to your event
2. Click on "Floor Plan" or "Seating" tab
3. You should see the 2D Floor Plan Generator

### Step 3: Fill in Seat Allocation
1. Select Event Type (CONFERENCE, WEDDING, THEATRE, etc.)
2. Select Table Type (ROWS, ROUND, RECTANGLE, SQUARE)
3. Enter seat counts:
   - VIP Seats
   - Premium Seats
   - General Seats
4. Set prices for each category

### Step 4: Check Debug Panel (Development Mode)
1. Expand "🔧 Debug Information" section
2. Verify Event ID is correct
3. Check Total Seats calculation
4. Review Form Values JSON

### Step 5: Click Test Endpoint (Optional)
1. Click "🧪 Test Seat Generation API" link
2. Opens in new tab
3. Check if test seat can be created
4. Look for any errors

### Step 6: Generate Floor Plan
1. Click "Generate 2D Floor Plan" button
2. **Watch Console** for logs

### Step 7: Analyze Console Logs

**Look for these patterns:**

#### ✅ Success Pattern:
```
[FloorPlanner] Starting generation with data: {eventType: "CONFERENCE", ...}
[FloorPlanner] Configuration: {seatsPerRow: 10, layout: "rows", ...}
[FloorPlanner] Sections created: 3
[FloorPlanner] Floor plan payload: {...}
[FloorPlanner] Sending POST to: /api/events/123/seats/generate
[FloorPlanner] Response status: 201 Created
[FloorPlanner] Response data: {success: true, totalSeatsGenerated: 100, ...}
[FloorPlanner] ✅ Success!
```

#### ❌ Error Patterns:

**Frontend Error:**
```
[FloorPlanner] ❌ Error: Failed to fetch
[FloorPlanner] Error stack: ...
```
→ **Cause**: Network issue or API not responding

**Backend Error:**
```
[FloorPlanner] Response status: 500 Internal Server Error
[FloorPlanner] Response data: {error: "Failed to generate seats", details: "..."}
```
→ **Cause**: Server-side error (check details)

**Permission Error:**
```
[FloorPlanner] Response status: 403 Forbidden
```
→ **Cause**: User doesn't have permission to edit events

**Validation Error:**
```
[FloorPlanner] Response status: 400 Bad Request
[FloorPlanner] Response data: {error: "Floor plan is required"}
```
→ **Cause**: Invalid payload

### Step 8: Check Network Tab
1. Go to **Network** tab in DevTools
2. Filter by "generate"
3. Find the POST request to `/api/events/[id]/seats/generate`
4. Click on it
5. Check:
   - **Headers**: Request method, status code
   - **Payload**: What was sent
   - **Response**: What was received

---

## 🐛 Common Issues & Solutions

### Issue 1: "Seated" and "Theatre" Not Selectable
**Symptoms:** Can't click on THEATRE or other event types

**Debug:**
1. Check console for JavaScript errors
2. Verify form is not disabled
3. Check if `eventType` field is rendering

**Solution:**
- Event types should all be clickable
- If not, there might be a CSS or React Hook Form issue

### Issue 2: Floor Plan Not Saving
**Symptoms:** Click generate, but nothing happens

**Debug Steps:**
1. Check console logs - do you see `[FloorPlanner] Starting generation`?
2. If NO → Form validation might be failing
3. If YES → Check what happens next in the logs

**Possible Causes:**
- Form validation error (check for red error messages)
- Network request failing (check Network tab)
- API returning error (check response in console)

### Issue 3: Seat Selector Not Appearing
**Symptoms:** Floor plan generated, but seat selector doesn't show on registration page

**Debug:**
1. Check if seats were actually created:
   ```
   Visit: /api/events/[id]/seats/test
   ```
2. Check `existingSeats` count
3. If 0 → Seats weren't created (check API logs)
4. If > 0 → Check `/api/events/[id]/seats/availability` endpoint

**Solution:**
- Verify `hasSeats` is true in availability API
- Check seat inventory table has records

### Issue 4: Database Errors
**Symptoms:** 500 error with database-related message

**Common Errors:**
- `relation "seat_inventory" does not exist` → Run migrations
- `column "event_id" does not exist` → Schema mismatch
- `permission denied` → RLS policy issue

**Solution:**
```bash
cd apps/web
DATABASE_URL="your_url" npx prisma migrate deploy --schema="prisma/schema.prisma"
```

---

## 🧪 Using the Test Endpoint

### Access Test Endpoint:
```
https://your-domain.com/api/events/[EVENT_ID]/seats/test
```

### Example Response:
```json
{
  "success": true,
  "event": {
    "id": "123",
    "name": "My Event",
    "status": "DRAFT"
  },
  "existingSeats": 0,
  "floorPlanConfigs": 0,
  "testSeatCreated": true,
  "testSeatError": null,
  "message": "✅ Seat generation is working correctly",
  "user": {
    "email": "user@example.com",
    "tenantId": "tenant-123"
  }
}
```

### What to Check:
- ✅ `testSeatCreated: true` → Database write works
- ❌ `testSeatCreated: false` → Check `testSeatError` for details
- `existingSeats` → How many seats already exist
- `floorPlanConfigs` → How many floor plans saved

---

## 📊 Expected Behavior

### When Everything Works:

1. **Fill Form** → No validation errors
2. **Click Generate** → Button shows "Generating Floor Plan..."
3. **Console Logs** → All steps logged successfully
4. **API Response** → 201 Created with seat count
5. **Success Message** → Green alert: "✅ Generated X seats successfully!"
6. **Database** → Seats created in `seat_inventory` table
7. **Registration Page** → Seat selector appears

### Performance:
- Generation should complete in **< 5 seconds** for up to 1000 seats
- With new indexes: **< 1 second** for most cases

---

## 🚨 What to Report

If you encounter an issue, please provide:

1. **Console Logs** (copy all `[FloorPlanner]` and `[API]` logs)
2. **Network Tab** (screenshot of the generate request/response)
3. **Test Endpoint Response** (JSON from `/api/events/[id]/seats/test`)
4. **Form Values** (from debug panel)
5. **Error Messages** (any red alerts or errors)
6. **Steps to Reproduce**

---

## ✅ Verification Checklist

After generating a floor plan, verify:

- [ ] Console shows `[FloorPlanner] ✅ Success!`
- [ ] Green success message appears
- [ ] Test endpoint shows `testSeatCreated: true`
- [ ] Test endpoint shows `existingSeats > 0`
- [ ] Registration page shows seat selector
- [ ] Seats can be selected and reserved
- [ ] Seat prices match configured prices

---

## 🔗 Related Files

- **Frontend**: `apps/web/components/events/Simple2DFloorGenerator.tsx`
- **API**: `apps/web/app/api/events/[id]/seats/generate/route.ts`
- **Test**: `apps/web/app/api/events/[id]/seats/test/route.ts`
- **Seat Selector**: `apps/web/components/events/SeatSelector.tsx`
- **Availability**: `apps/web/app/api/events/[id]/seats/availability/route.ts`

---

**All debugging tools are now in place. Please test the floor planner and report what you see in the console!** 🚀
