# Sessions Integration into Create Event Form

## ✅ What's Implemented

### 1. Stepper Navigation
- **File**: `apps/web/components/events/CreateEventForm.tsx`
- **Steps**: Basics → Schedule → Location → Planning → Banner → **Sessions** → Review
- Navigate using step chips or Back/Next buttons
- Direct access via URL: `/events/new?step=sessions`

### 2. Sessions Form (Step 6)
Matches the manage page exactly with these fields:
- **Title** (required) - e.g., "Opening Keynote"
- **Track** (optional) - e.g., "Main"
- **Room** (optional) - e.g., "Hall A"
- **Capacity** (optional) - e.g., 200
- **Starts** (required) - datetime-local picker
- **Ends** (required) - datetime-local picker
- **Description** (optional) - textarea for session details

### 3. Session Queue
- Add multiple sessions before creating the event
- Preview list shows: title, time range, room
- Remove button for each queued session
- All sessions are created automatically after event creation

### 4. Backend Integration
- After event is created successfully
- Loops through queued sessions
- POSTs to `/api/events/{eventId}/sessions` for each
- Converts datetime-local to ISO timestamps
- Safe error handling (won't block event creation)

## 🎯 How to Use

1. **Navigate to Create Event**: `/events/new`
2. **Fill basic info** in steps 1-5
3. **Click "6. Sessions"** step or use Next button
4. **Add sessions**:
   - Fill Title, Starts, Ends (required)
   - Optionally add Track, Room, Capacity, Description
   - Click "Add Session" to queue
5. **Review queued sessions** in the list
6. **Click "Create"** - Event + all sessions are created
7. **Redirect** to home with success banner

## 📁 Files Modified

- `apps/web/components/events/CreateEventForm.tsx`
  - Added stepper state and UI
  - Sessions form in step 5
  - Session creation logic in onSubmit
  
## 🔄 Session Creation Flow

```
User fills event form
  ↓
User adds sessions (queued in state)
  ↓
User clicks "Create"
  ↓
Event created → Planning saved → Location linked
  ↓
Loop through sessions array
  ↓
POST each session to /api/events/{id}/sessions
  ↓
Redirect to home
```

## ✨ Features

- **Non-blocking**: Sessions are optional; skip step if not needed
- **Validation**: Add button disabled until Title + Start + End filled
- **Preview**: See all queued sessions before submitting
- **Flexible**: Add/remove sessions before final create
- **Consistent**: Matches manage page styling and fields exactly

## 🚀 Next Steps (Optional)

- Add validation: prevent end <= start
- Allow editing queued sessions (not just remove)
- Add speaker assignment during creation
- Bulk import sessions from CSV/Excel
