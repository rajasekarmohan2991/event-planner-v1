# Events & Sessions Issues - Fix Guide

## Issues

### 1. Events Not Showing in Events Management
**Problem:** Created events (both draft and published) are not visible in the events management page.

### 2. Session Time Validation Missing
**Problem:** Sessions can be created outside the event's start/end time range.

---

## Issue 1: Events Not Showing

### Debugging Steps

**1. Check Browser Console:**
The events page already has logging. Open browser console and look for:
```
🔄 Fetching events from /api/events...
📡 API Response Status: 200 OK
📦 API Response Data: { events: [...] }
✅ Loaded X events
```

**2. Check for Errors:**
```
❌ API Error Response: ...
⚠️ No events returned from API
💡 Check server logs for role/permission issues
```

### Common Causes

**A. Role/Permission Filtering**
The `/api/events` endpoint filters events based on user role and tenant.

**Check:** `apps/web/app/api/events/route.ts` around line 162-173

**Issue:** Admin roles might be filtered by tenant, preventing them from seeing all events.

**Solution:** Already fixed in previous session - admin roles should see all events.

**B. Empty Database**
No events exist in the database.

**Check:**
```sql
SELECT id, name, status, tenant_id FROM events ORDER BY created_at DESC LIMIT 10;
```

**C. Frontend Filtering**
The frontend filters events by status (all, draft, upcoming, past).

**Check:** `apps/web/app/(admin)/admin/events/page.tsx` line 81-94

**Current Logic:**
```typescript
if (filter === 'all') return true  // Shows all
if (filter === 'draft') return event.status === 'DRAFT'
if (filter === 'upcoming') return startDate > new Date() && status !== 'DRAFT'
if (filter === 'past') return endDate < new Date()
```

**D. API Response Format**
Backend might return different format than expected.

**Expected:**
```json
{
  "events": [
    {
      "id": "1",
      "name": "My Event",
      "status": "DRAFT",
      "startDate": "2025-01-01T10:00:00Z",
      "endDate": "2025-01-01T18:00:00Z"
    }
  ]
}
```

### Quick Fix

**Add more logging to see what's happening:**

```typescript
// In apps/web/app/(admin)/admin/events/page.tsx
const loadEvents = async () => {
  try {
    const res = await fetch('/api/events', { cache: 'no-store' })
    const data = await res.json()
    
    console.log('📊 Full API Response:', data)
    console.log('📊 Events array:', data.events)
    console.log('📊 Events count:', data.events?.length)
    console.log('📊 First event:', data.events?.[0])
    
    setEvents(data.events || [])
  } catch (error) {
    console.error('❌ Error:', error)
  }
}
```

---

## Issue 2: Session Time Validation

### Problem
Sessions can be created with start/end times outside the event's time range.

**Example:**
- Event: Jan 1, 2025 10:00 AM - 6:00 PM
- Session: Jan 2, 2025 9:00 AM - 10:00 AM ❌ (outside event time)

### Solution

Add validation to check if session times are within event times.

**File:** `apps/web/app/events/[id]/sessions/page.tsx`

**Step 1: Fetch Event Details**

Add state to store event info:
```typescript
const [event, setEvent] = useState<any>(null)

useEffect(() => {
  const fetchEvent = async () => {
    const res = await fetch(`/api/events/${params.id}`)
    if (res.ok) {
      const data = await res.json()
      setEvent(data)
    }
  }
  fetchEvent()
}, [params.id])
```

**Step 2: Add Validation Function**

```typescript
const validateSessionTime = (sessionStart: string, sessionEnd: string) => {
  if (!event) return { valid: true }
  
  const eventStart = new Date(event.startsAt || event.startDate)
  const eventEnd = new Date(event.endsAt || event.endDate)
  const sessStart = new Date(sessionStart)
  const sessEnd = new Date(sessionEnd)
  
  // Check if session is within event time
  if (sessStart < eventStart) {
    return {
      valid: false,
      message: `Session cannot start before event starts (${eventStart.toLocaleString()})`
    }
  }
  
  if (sessEnd > eventEnd) {
    return {
      valid: false,
      message: `Session cannot end after event ends (${eventEnd.toLocaleString()})`
    }
  }
  
  if (sessStart < new Date()) {
    return {
      valid: false,
      message: 'Session cannot start in the past'
    }
  }
  
  return { valid: true }
}
```

**Step 3: Use Validation in Submit**

Update the submit handler (line ~288):

```typescript
onClick={async () => {
  try {
    setError(null)
    
    // Existing validations
    if (!title.trim()) { setError('Title is required'); return }
    if (!startTime) { setError('Start time is required'); return }
    if (!endTime) { setError('End time is required'); return }
    if (new Date(endTime) <= new Date(startTime)) { 
      setError('End time must be after start time'); 
      return 
    }
    
    // NEW: Validate against event time
    const validation = validateSessionTime(startTime, endTime)
    if (!validation.valid) {
      setError(validation.message)
      return
    }
    
    // Continue with creation...
    const payload = { ... }
    const res = await fetch(...)
  } catch (e: any) {
    setError(e?.message || 'Create failed')
  }
}}
```

**Step 4: Show Event Time Range**

Add a helpful info box showing the event's time range:

```typescript
{/* Add after the "Add Session" heading */}
{event && (
  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
    <div className="text-xs font-semibold text-blue-900 mb-1">
      📅 Event Time Range
    </div>
    <div className="text-xs text-blue-700">
      {new Date(event.startsAt || event.startDate).toLocaleString()} 
      {' → '}
      {new Date(event.endsAt || event.endDate).toLocaleString()}
    </div>
    <div className="text-xs text-blue-600 mt-1">
      ℹ️ Sessions must be created within this time range
    </div>
  </div>
)}
```

**Step 5: Set Default Times**

Auto-populate start/end times with event's start time:

```typescript
useEffect(() => {
  if (event && !startTime) {
    const eventStart = new Date(event.startsAt || event.startDate)
    const defaultStart = eventStart.toISOString().slice(0, 16)
    const defaultEnd = new Date(eventStart.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16)
    
    setStartTime(defaultStart)
    setEndTime(defaultEnd)
  }
}, [event])
```

---

## Complete Implementation

### File: `apps/web/app/events/[id]/sessions/page.tsx`

**Add these changes:**

1. **Add event state (line ~16):**
```typescript
const [event, setEvent] = useState<any>(null)
```

2. **Fetch event details (line ~113):**
```typescript
useEffect(() => {
  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setEvent(data)
      }
    } catch (e) {
      console.error('Failed to fetch event:', e)
    }
  }
  
  if (status !== 'loading') {
    load()
    fetchEvent()
  }
}, [status, params.id])
```

3. **Add validation function (line ~32):**
```typescript
const validateSessionTime = (sessionStart: string, sessionEnd: string) => {
  if (!event) return { valid: true }
  
  const eventStart = new Date(event.startsAt || event.startDate)
  const eventEnd = new Date(event.endsAt || event.endDate)
  const sessStart = new Date(sessionStart)
  const sessEnd = new Date(sessionEnd)
  
  if (sessStart < eventStart) {
    return {
      valid: false,
      message: `Session cannot start before event (${eventStart.toLocaleString()})`
    }
  }
  
  if (sessEnd > eventEnd) {
    return {
      valid: false,
      message: `Session cannot end after event (${eventEnd.toLocaleString()})`
    }
  }
  
  return { valid: true }
}
```

4. **Add validation to submit (line ~294):**
```typescript
// After existing validations
const validation = validateSessionTime(startTime, endTime)
if (!validation.valid) {
  setError(validation.message)
  return
}
```

5. **Add event time info box (line ~138):**
```typescript
{event && (
  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
    <div className="text-xs font-semibold text-blue-900">
      📅 Event: {new Date(event.startsAt || event.startDate).toLocaleString()} 
      → {new Date(event.endsAt || event.endDate).toLocaleString()}
    </div>
    <div className="text-xs text-blue-600 mt-1">
      Sessions must be within this time range
    </div>
  </div>
)}
```

---

## Testing

### Test Events Showing:

1. Open `/admin/events`
2. Check browser console for logs
3. Look for API response
4. Check if events array is populated
5. Try different filters (All, Draft, Upcoming, Past)

### Test Session Validation:

1. Create an event: Jan 1, 2025 10:00 AM - 6:00 PM
2. Go to Sessions tab
3. Try to create session: Jan 2, 2025 9:00 AM - 10:00 AM
4. Should show error: "Session cannot start after event ends"
5. Create valid session: Jan 1, 2025 11:00 AM - 12:00 PM
6. Should succeed ✅

---

## Summary

### Events Not Showing:
- Check browser console logs
- Verify API response format
- Check role/permission filtering
- Verify database has events
- Check frontend filter logic

### Session Validation:
- Fetch event details
- Validate session times against event times
- Show helpful error messages
- Display event time range
- Auto-populate default times

---

## Next Steps

1. **Debug events not showing:**
   - Check browser console
   - Check API response
   - Verify database

2. **Implement session validation:**
   - Add event state
   - Add validation function
   - Update submit handler
   - Add info box

3. **Test thoroughly:**
   - Create events
   - Create sessions
   - Try invalid times
   - Verify error messages
