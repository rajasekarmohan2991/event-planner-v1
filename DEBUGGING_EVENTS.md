# 🔍 Events Debugging Guide

## Issue: SUPER_ADMIN Not Seeing Events in "All Events" Module

This guide will help you diagnose why events aren't showing up.

---

## Step 1: Check Database Directly

Run the diagnostic script to see what's actually in your database:

```bash
cd apps/web
node scripts/check-events.js
```

**What to look for:**
- ✅ Total number of events in database
- ✅ Event statuses (DRAFT, PUBLISHED, etc.)
- ✅ Which tenants own the events
- ✅ Whether SUPER_ADMIN users exist

**Possible outcomes:**

### A) No events found
**Solution:** Create a test event first
- Go to `/admin/events/create`
- Fill in basic details
- Save the event

### B) Events exist but have wrong status
**Solution:** Events might be in DRAFT status
- SUPER_ADMIN sees ALL statuses (including DRAFT)
- Check the "Draft" tab in the UI
- Or publish the events

### C) Events exist but no SUPER_ADMIN user
**Solution:** Your user role might not be set correctly
- Check your user record in the database
- Update role to 'SUPER_ADMIN'

---

## Step 2: Check Browser Console Logs

After deployment, open the "All Events" page with DevTools open:

1. **Open Browser DevTools** (F12 or Right-click → Inspect)
2. **Go to Console tab**
3. **Navigate to** `/admin/events`
4. **Look for these logs:**

```
🔄 Fetching events from /api/events...
📡 API Response Status: 200 OK
📦 API Response Data: { events: [...], total: X }
✅ Loaded X events
```

**If you see:**
- `⚠️ No events returned from API` → Check server logs (Step 3)
- `❌ API Error Response` → Permission or authentication issue
- Nothing at all → Network issue or API not responding

---

## Step 3: Check Server Logs (Vercel/Railway)

Look at your deployment platform logs for these messages:

### Expected for SUPER_ADMIN:
```
🔍 GET /api/events (Prisma) - User: admin@example.com, Role: SUPER_ADMIN, Tenant: xxx
✅ SUPER_ADMIN detected - No tenant filtering applied
📋 Final where clause: {}
📊 Query results: Found X events (Total: X)
```

### If you see:
```
🌍 Public mode - Filtering by published statuses
```
**Problem:** You're not logged in as SUPER_ADMIN
**Solution:** Check your user role in database

### If you see:
```
📊 Query results: Found 0 events (Total: 0)
```
**Problem:** No events in database OR wrong filtering
**Solution:** Run diagnostic script (Step 1)

---

## Step 4: Verify User Role

Check your user account in the database:

```sql
SELECT id, name, email, role, current_tenant_id 
FROM users 
WHERE email = 'your-email@example.com';
```

**Expected for SUPER_ADMIN:**
- `role` should be exactly `'SUPER_ADMIN'` (case-sensitive)
- `current_tenant_id` can be anything (SUPER_ADMIN ignores it)

**If role is wrong:**
```sql
UPDATE users 
SET role = 'SUPER_ADMIN' 
WHERE email = 'your-email@example.com';
```

---

## Step 5: Test API Directly

Use curl or Postman to test the API:

```bash
# Get your session cookie from browser DevTools → Application → Cookies
# Then test the API:

curl 'https://your-app.vercel.app/api/events' \
  -H 'Cookie: __Secure-next-auth.session-token=YOUR_TOKEN_HERE'
```

**Expected response:**
```json
{
  "events": [...],
  "totalElements": 5,
  "totalPages": 1
}
```

---

## Common Issues & Solutions

### Issue 1: "No events found" but database has events
**Cause:** Status filtering
**Solution:** 
- Check event statuses in database
- SUPER_ADMIN should see ALL statuses
- Try the "Draft" tab if events are in DRAFT status

### Issue 2: Events show in one tenant but not globally
**Cause:** Logged in as Tenant Admin, not SUPER_ADMIN
**Solution:** 
- Verify user role is 'SUPER_ADMIN'
- Log out and log back in after role change

### Issue 3: API returns 401 Unauthorized
**Cause:** Not logged in or session expired
**Solution:**
- Log out and log back in
- Clear browser cookies
- Check session configuration

### Issue 4: API returns 403 Forbidden
**Cause:** Permission check blocking access
**Solution:**
- Check `checkPermissionInRoute` in API code
- Verify module_access_matrix table has correct permissions

---

## Quick Fixes

### Create a Test Event via API

```bash
curl -X POST 'https://your-app.vercel.app/api/events' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: __Secure-next-auth.session-token=YOUR_TOKEN' \
  -d '{
    "name": "Test Event",
    "description": "Testing event visibility",
    "startsAt": "2025-12-25T10:00:00Z",
    "endsAt": "2025-12-25T18:00:00Z",
    "status": "PUBLISHED",
    "venue": "Test Venue",
    "city": "Mumbai"
  }'
```

### Force Refresh Events List

In browser console:
```javascript
// Clear cache and reload
localStorage.clear()
sessionStorage.clear()
location.reload(true)
```

---

## Still Not Working?

If none of the above helps, provide:

1. **Output from diagnostic script** (`node scripts/check-events.js`)
2. **Browser console logs** (screenshot or copy-paste)
3. **Server logs** from Vercel/Railway (last 50 lines)
4. **Your user role** from database query

This will help identify the exact issue!
