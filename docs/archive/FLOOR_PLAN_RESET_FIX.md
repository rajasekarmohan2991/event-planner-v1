# Floor Plan Design Reset Fix - Dec 9, 2025

## Issue Reported
When creating a new event and going to Design → Floor Plan, the page was showing floor plan designs from other events instead of starting with a blank canvas.

**User's exact words**: "I HAVE CREATED A NEW EVENTS AND TRIED TO CREATE A DESIGN, BUT ALREADY THERE ARE DESIGN FOR THE EVENTS BY DEFAULT WHICH IS THE DESIGN THAT I CREATED FOR OTHERS EVENTS THOSE ARE SHOWING HERE WHICH IS WRONG"

---

## Root Cause

The floor plan designer page was not properly resetting its state when switching between different events. The canvas, draggable items, and other UI state were persisting from the previous event, making it appear as if the new event already had a floor plan design.

### What Was Happening
1. User creates Event A and designs a floor plan
2. User creates Event B (new event)
3. User goes to Event B → Design → Floor Plan
4. **Problem**: Canvas still shows Event A's design
5. Draggable items (entry/exit points, restrooms, etc.) from Event A are still visible

### Why It Happened
The React component state was not being reset when the `eventId` parameter changed in the URL. The component would re-render with the new event ID, but the canvas and UI state remained from the previous event.

---

## Fix Applied

### File Modified
`/apps/web/app/events/[id]/design/floor-plan/page.tsx`

### Changes Made

#### 1. Added Event ID Tracking
```typescript
const [currentEventId, setCurrentEventId] = useState<string>('')
```

#### 2. Added Reset Effect
```typescript
// Reset canvas when event ID changes
useEffect(() => {
  if (eventId && eventId !== currentEventId) {
    // Clear canvas and reset state for new event
    setShowCanvas(false)
    setAutoUpdate(false)
    setDraggableItems([])
    setDraggedItem(null)
    setCurrentEventId(eventId)
    
    // Clear canvas if it exists
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }
}, [eventId, currentEventId])
```

### What This Does

When the event ID changes (e.g., navigating from Event A to Event B):

1. ✅ **Hides the canvas** - `setShowCanvas(false)`
2. ✅ **Disables auto-update** - `setAutoUpdate(false)`
3. ✅ **Clears draggable items** - `setDraggableItems([])`
4. ✅ **Clears drag state** - `setDraggedItem(null)`
5. ✅ **Updates tracking** - `setCurrentEventId(eventId)`
6. ✅ **Clears canvas pixels** - `ctx.clearRect(0, 0, canvas.width, canvas.height)`

---

## How It Works Now

### Scenario 1: Creating First Floor Plan
1. Go to Event → Design → Floor Plan
2. **Expected**: ✅ Blank canvas, no designs visible
3. Fill in hall dimensions, guest count, etc.
4. Click "Generate Floor Plan"
5. **Expected**: ✅ New floor plan appears

### Scenario 2: Switching Between Events
1. Go to Event A → Design → Floor Plan
2. Generate a floor plan for Event A
3. Navigate to Event B → Design → Floor Plan
4. **Expected**: ✅ Blank canvas (Event A's design is NOT visible)
5. Generate a new floor plan for Event B
6. **Expected**: ✅ Event B's unique floor plan appears

### Scenario 3: Returning to Previous Event
1. Go to Event A → Design → Floor Plan (has existing design)
2. Navigate to Event B → Design → Floor Plan (blank)
3. Go back to Event A → Design → Floor Plan
4. **Expected**: ✅ Blank canvas initially (must regenerate)
5. **Note**: Floor plans are not persisted to database yet, so you'll need to regenerate

---

## Data Storage Explanation

### What IS Stored Per Event
- **Seat Counts** (VIP/Premium/General) - Stored in `KeyValue` table
  ```sql
  SELECT * FROM "KeyValue" WHERE namespace = 'event_seat_counts';
  ```
- **Seat Inventory** - Stored in `seat_inventory` table (after generation)
  ```sql
  SELECT * FROM seat_inventory WHERE event_id = 12;
  ```

### What IS NOT Stored (Yet)
- **Canvas Design** - The visual floor plan layout is not persisted
- **Draggable Items** - Entry/exit points, restrooms, etc. are not saved
- **Hall Dimensions** - Hall length, width, etc. are not saved

### Why This Matters
When you navigate away from the floor plan page and come back:
- ✅ Seat counts will be remembered (loaded from database)
- ❌ Visual canvas will be blank (not persisted)
- ❌ Draggable items will be reset (not persisted)

**To see the floor plan again**: Click "Generate Floor Plan" button

---

## Testing Instructions

### Test 1: New Event Has Blank Canvas
1. Create a new event (Event X)
2. Go to Event X → Design → Floor Plan
3. **Expected**: 
   - ✅ No canvas visible initially
   - ✅ Form shows default values
   - ✅ No draggable items on canvas
4. Fill in details and click "Generate Floor Plan"
5. **Expected**: ✅ Floor plan generates successfully

### Test 2: Switching Events Resets Canvas
1. Go to Event A → Design → Floor Plan
2. Generate a floor plan (e.g., 100 guests, banquet style)
3. Go to Event B → Design → Floor Plan
4. **Expected**: 
   - ✅ Canvas is blank (Event A's design is gone)
   - ✅ Form shows Event B's capacity (not Event A's)
   - ✅ No draggable items from Event A
5. Generate a different floor plan (e.g., 200 guests, theater style)
6. **Expected**: ✅ Event B's floor plan is different from Event A

### Test 3: Seat Counts Are Event-Specific
1. Go to Event A → Design → Floor Plan
2. Set: VIP=10, Premium=20, General=30
3. Generate floor plan
4. Go to Event B → Design → Floor Plan
5. **Expected**: 
   - ✅ Seat counts are different (Event B's values, not Event A's)
   - ✅ If Event B has no saved seat counts, shows defaults based on Event B's capacity

---

## Database Verification

### Check Seat Counts Per Event
```sql
SELECT 
  namespace,
  key as event_id,
  value->>'vipSeats' as vip,
  value->>'premiumSeats' as premium,
  value->>'generalSeats' as general,
  value->>'updatedBy' as updated_by
FROM "KeyValue"
WHERE namespace = 'event_seat_counts'
ORDER BY key;
```

**Expected**: Each event has its own seat count record

### Check Seat Inventory Per Event
```sql
SELECT 
  event_id,
  section,
  COUNT(*) as seat_count
FROM seat_inventory
GROUP BY event_id, section
ORDER BY event_id, section;
```

**Expected**: Seats are grouped by event_id

---

## Known Limitations

### 1. Floor Plan Not Persisted
**Issue**: Visual floor plan design is not saved to database
**Workaround**: Regenerate floor plan each time you visit the page
**Future Fix**: Add floor plan persistence to database

### 2. Draggable Items Not Saved
**Issue**: Entry/exit points, restrooms, etc. are not saved
**Workaround**: Re-add draggable items each time
**Future Fix**: Save draggable items configuration

### 3. Canvas State Only in Memory
**Issue**: Canvas design exists only in browser memory
**Workaround**: Take screenshots if you need to save the design
**Future Fix**: Export floor plan as image or PDF

---

## Services Status

```bash
docker compose ps
```

**Expected**:
- ✅ PostgreSQL: Running and healthy
- ✅ Redis: Running and healthy
- ✅ Java API: Running on port 8081
- ✅ Next.js Web: **Rebuilt and running on port 3001**

---

## Summary

### Problem
New events were showing floor plan designs from other events

### Solution
Added event ID tracking and reset logic to clear canvas and state when switching events

### Result
✅ Each event now starts with a blank canvas
✅ Switching between events properly resets the floor plan designer
✅ Seat counts remain event-specific (stored in database)
✅ No cross-contamination of designs between events

**Floor plan designer now properly resets for each event!** 🎉

---

## Additional Notes

### For Future Enhancement
Consider implementing:
1. **Floor Plan Persistence**: Save canvas design to database
2. **Floor Plan Templates**: Pre-defined layouts for common event types
3. **Floor Plan History**: Track changes and allow reverting
4. **Export Options**: Download floor plan as PNG/PDF
5. **Import Options**: Upload existing floor plan images

### For Organizers
- Always click "Generate Floor Plan" to see the design
- Seat counts are saved automatically when you generate
- Visual design is not saved (regenerate as needed)
- Each event has its own independent floor plan
