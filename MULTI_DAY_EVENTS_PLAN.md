# Multi-Day Event Schedule Implementation Plan

## Overview
Implement proper multi-day event handling with per-day time ranges and session validation.

## Current Status
✅ UI already exists for configuring each day's start/end time
❌ Data is not being saved to database
❌ Session validation doesn't check against day-specific times

## Implementation Steps

### 1. Database Schema Update
Add `daysConfig` JSON field to Event model to store per-day schedules:
```prisma
model Event {
  // ... existing fields
  daysConfig Json? // Stores array of {date, title, startTime, endTime}
}
```

### 2. Update Event Creation API
File: `/apps/web/app/api/super-admin/companies/[id]/events/route.ts`

- Accept `daysConfig` in request body
- Save to database
- Validate that daysConfig matches the date range

### 3. Update Session Validation
File: `/apps/web/app/api/events/[id]/sessions/route.ts`

Current validation:
```typescript
if (sessionStart < eventStart || sessionEnd > eventEnd) {
  return error
}
```

New validation:
```typescript
// 1. Determine which day the session falls on
// 2. Get that day's specific start/end time from daysConfig
// 3. Validate session is within that day's time range
// 4. Show helpful error: "Session must be between Day 2: 10:00 AM - 6:00 PM"
```

### 4. Update Session Creation UI
File: `/apps/web/app/events/[id]/sessions/page.tsx`

- Fetch event's `daysConfig`
- Display available time ranges for each day
- Show validation message with specific day times

## Example Data Structure

```json
{
  "name": "Tech Conference 2025",
  "start_date": "2025-01-15",
  "end_date": "2025-01-17",
  "daysConfig": [
    {
      "date": "2025-01-15T00:00:00.000Z",
      "title": "Day 1: Workshops",
      "startTime": "09:00",
      "endTime": "17:00"
    },
    {
      "date": "2025-01-16T00:00:00.000Z",
      "title": "Day 2: Main Conference",
      "startTime": "08:00",
      "endTime": "20:00"
    },
    {
      "date": "2025-01-17T00:00:00.000Z",
      "title": "Day 3: Networking",
      "startTime": "10:00",
      "endTime": "15:00"
    }
  ]
}
```

## Validation Logic

```typescript
function validateSessionTime(sessionStart: Date, sessionEnd: Date, event: Event) {
  // Single-day event: use event start/end
  if (!event.daysConfig || event.daysConfig.length <= 1) {
    return validateAgainstEventTimes(sessionStart, sessionEnd, event)
  }
  
  // Multi-day event: find the correct day
  const sessionDate = sessionStart.toISOString().split('T')[0]
  const dayConfig = event.daysConfig.find(d => 
    d.date.split('T')[0] === sessionDate
  )
  
  if (!dayConfig) {
    return {
      valid: false,
      message: `Session date ${sessionDate} is not within event dates`
    }
  }
  
  // Combine date + time for validation
  const dayStart = new Date(`${sessionDate}T${dayConfig.startTime}:00`)
  const dayEnd = new Date(`${sessionDate}T${dayConfig.endTime}:00`)
  
  if (sessionStart < dayStart || sessionEnd > dayEnd) {
    return {
      valid: false,
      message: `Session must be between ${dayConfig.title}: ${dayConfig.startTime} - ${dayConfig.endTime}`
    }
  }
  
  return { valid: true }
}
```

## Files to Modify

1. `prisma/schema.prisma` - Add daysConfig field
2. `/api/super-admin/companies/[id]/events/route.ts` - Save daysConfig
3. `/api/events/[id]/sessions/route.ts` - Update validation
4. `/app/events/[id]/sessions/page.tsx` - Show day-specific time ranges

## Estimated Effort
- Database migration: 5 min
- API updates: 15 min
- Validation logic: 20 min
- UI updates: 10 min
- Testing: 10 min

**Total: ~60 minutes**

## Next Steps
1. Run database migration to add daysConfig field
2. Update event creation API
3. Update session validation
4. Test with 3-day event
