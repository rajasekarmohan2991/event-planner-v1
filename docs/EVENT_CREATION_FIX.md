# Event Creation 400 Error - Troubleshooting Guide

**Date:** November 12, 2025
**Issue:** 400 Bad Request when creating events
**User:** SUPER_ADMIN (fiserv@gmail.com)

## ✅ Verified Working Components

1. **User Authentication:** ✅ User exists with SUPER_ADMIN role
2. **Permissions:** ✅ SUPER_ADMIN has `events.create` permission
3. **API Route:** ✅ `/api/events` POST endpoint exists
4. **Frontend Form:** ✅ Event creation form at `/events/new`

## 🔍 Possible Root Causes

### 1. Java API Not Receiving Request
**Symptom:** 400 error before reaching Java API
**Check:**
```bash
docker compose -f docker-compose.dev.yml logs api --tail=100
```

### 2. Missing Required Fields
**Symptom:** Java API validation failing
**Required Fields:**
- `name` (string, required)
- `startsAt` (ISO-8601 datetime, required)
- `endsAt` (ISO-8601 datetime, required)

### 3. Invalid Date Format
**Symptom:** Date parsing error
**Expected Format:** `2025-12-01T10:00:00Z`

### 4. Missing Tenant ID
**Symptom:** Multi-tenant validation failing
**Solution:** Ensure `x-tenant-id` header is set

## 🔧 Quick Fixes

### Fix 1: Add Debug Logging

Add this to `/apps/web/app/api/events/route.ts` line 18:

```typescript
const body = await req.text()
console.log('📝 POST /api/events - Body:', body)
console.log('📝 Headers:', {
  tenant: req.headers.get('x-tenant-id'),
  role: (session as any)?.user?.role,
  email: (session as any)?.user?.email
})
```

### Fix 2: Check Java API Health

```bash
curl http://localhost:8081/api/events
```

Should return 200 with events list.

### Fix 3: Test Direct API Call

```bash
curl -X POST http://localhost:8081/api/events \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: default-tenant" \
  -H "x-user-role: SUPER_ADMIN" \
  -d '{
    "name": "Test Event",
    "startsAt": "2025-12-01T10:00:00Z",
    "endsAt": "2025-12-01T18:00:00Z",
    "venue": "Test Venue",
    "city": "Mumbai",
    "category": "CONFERENCE",
    "eventMode": "IN_PERSON"
  }'
```

### Fix 4: Ensure Database Schema Matches

```sql
-- Check events table structure
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d event_planner -c "\d events"
```

Required columns:
- `name` VARCHAR
- `starts_at` TIMESTAMP
- `ends_at` TIMESTAMP
- `tenant_id` VARCHAR
- `created_by` BIGINT

## 📋 Step-by-Step Debugging

### Step 1: Check Web Container Logs
```bash
docker compose -f docker-compose.dev.yml logs web --tail=50 --follow
```

### Step 2: Try Creating Event
1. Go to http://localhost:3001/events/new
2. Fill in the form
3. Click "Create Event"
4. Watch the logs

### Step 3: Check API Logs
```bash
docker compose -f docker-compose.dev.yml logs api --tail=50 --follow
```

Look for:
- POST /api/events
- Any error messages
- Validation failures

### Step 4: Check Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try creating event
4. Click on the failed request
5. Check:
   - Request URL
   - Request Headers
   - Request Payload
   - Response

## 🎯 Most Likely Issues

### Issue 1: Missing `created_by` Field

The Java API might require `created_by` field. Fix in `/apps/web/components/events/CreateEventStepperWithSidebar.tsx`:

```typescript
const payload = {
  name: data.title,
  venue: data.venue,
  city: data.city,
  startsAt: startIso,
  endsAt: endIso,
  description: data.description,
  bannerUrl: data.bannerImage || data.imageUrl || undefined,
  category: data.category,
  eventMode: (data.eventMode ? String(data.eventMode).toUpperCase() : 'IN_PERSON'),
  expectedAttendees: typeof data.capacity === 'number' ? data.capacity : undefined,
  createdBy: session?.user?.id, // ADD THIS LINE
}
```

### Issue 2: Invalid Category

Check if category values match Java enum:
- CONFERENCE
- WORKSHOP
- SEMINAR
- MEETUP
- WEBINAR
- EXHIBITION
- CONCERT
- SPORTS
- OTHER

### Issue 3: Invalid Event Mode

Check if eventMode values match Java enum:
- IN_PERSON
- VIRTUAL
- HYBRID

## 🚀 Immediate Action Plan

1. **Add Logging** (2 minutes)
   - Add console.log to API route
   - Restart web container

2. **Test Direct API** (1 minute)
   - Use curl to test Java API directly
   - Verify it works

3. **Check Frontend Payload** (2 minutes)
   - Open browser console
   - Check what's being sent

4. **Fix Missing Fields** (3 minutes)
   - Add any missing required fields
   - Rebuild if needed

## 📝 Expected Behavior

**Success Response (201):**
```json
{
  "id": 123,
  "name": "Test Event",
  "status": "DRAFT",
  "createdAt": "2025-11-12T06:00:00Z"
}
```

**Error Response (400):**
```json
{
  "message": "Validation failed",
  "errors": ["Field 'name' is required"]
}
```

## 🔄 After Fix

1. Restart containers:
```bash
docker compose -f docker-compose.dev.yml restart web
```

2. Clear browser cache (Ctrl+Shift+R)

3. Try creating event again

4. Verify event appears in database:
```sql
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d event_planner -c "SELECT id, name, status FROM events ORDER BY created_at DESC LIMIT 5;"
```

## 📞 Need More Help?

If issue persists, provide:
1. Full error message from browser console
2. Request payload from Network tab
3. Response from API
4. Java API logs during request

This will help identify the exact issue.
