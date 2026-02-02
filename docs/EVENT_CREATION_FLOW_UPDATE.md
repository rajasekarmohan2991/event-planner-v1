# Event Creation Flow - Updated

## ✅ New Flow Implemented

The event creation form has been reorganized for a better user experience with smart venue suggestions.

---

## 📋 New Step-by-Step Flow

### **Step 1: Basic Info + Event Details**
User enters:
1. **Event Title** - Name of the event
2. **Description** - What the event is about
3. **Event Type** - Conference, Workshop, Meetup, Webinar, etc.
4. **Category** - Business, Technology, Art, Music, etc.
5. **Expected Capacity** - Number of attendees (e.g., 100)

**Why this order?**
- Collects all event characteristics first
- Capacity helps filter suitable venues
- Type and category help match venue types

---

### **Step 2: Location & Venue (Smart Suggestions)**
User enters:
1. **City** - Type to search cities (autocomplete)
2. **Venue** - Select from filtered suggestions

**Smart Venue Filtering:**
- ✅ Filtered by **city** entered
- ✅ Filtered by **event type** from Step 1
- ✅ Filtered by **category** from Step 1
- ✅ Filtered by **capacity** (80%-150% of required)
- ✅ Sorted by **best capacity match** (closest first)

**Display:**
- Shows event details from Step 1 as summary
- Venue list shows capacity when available
- Example: "Grand Hotel (Capacity: 150)"

---

### **Step 3: Schedule**
User enters:
1. **Start Date**
2. **End Date** (optional)
3. **Start Time**
4. **End Time**
5. **Timezone**

---

### **Step 4: Media**
User uploads:
1. **Event Image** (optional)
2. **Video URL** (optional)
3. **Banner Image** (optional)

---

## 🔍 Venue Search API Integration

### OpenStreetMap Overpass API

**Endpoint**: `/api/venues/search`

**Query Parameters**:
```typescript
{
  city: string,              // Required: City name
  type: string,              // Event type (lowercase)
  category: string,          // Event category (lowercase)
  minCapacity: number,       // 80% of required capacity
  maxCapacity: number        // 150% of required capacity
}
```

**Example Request**:
```
GET /api/venues/search?city=Mumbai&type=conference&category=business&minCapacity=80&maxCapacity=150
```

**Response**:
```json
{
  "venues": [
    {
      "name": "Grand Conference Center",
      "capacity": 120,
      "rooms": 5,
      "lat": 19.0760,
      "lon": 72.8777,
      "type": "conference_centre",
      "address": "123 Main St, Mumbai"
    },
    {
      "name": "Business Hotel",
      "capacity": 100,
      "rooms": 50,
      "lat": 19.0761,
      "lon": 72.8778,
      "type": "hotel"
    }
  ]
}
```

### Venue Type Mapping

| Event Type | OSM Query Types |
|------------|----------------|
| Conference | conference_centre, hotel |
| Workshop | community_centre, coworking_space |
| Meetup | cafe, restaurant, community_centre |
| Concert | theatre, arts_centre, music_venue |
| Exhibition | exhibition_centre, gallery |
| Festival | park, events_venue |
| Webinar | (no physical venue needed) |

---

## 🎯 Smart Filtering Logic

### Capacity Matching
```typescript
// User enters: 100 capacity
minCapacity = 100 * 0.8 = 80    // 80% of required
maxCapacity = 100 * 1.5 = 150   // 150% of required

// Venues filtered: 80 <= capacity <= 150
```

### Sorting Algorithm
```typescript
// Sort by closest capacity match
venues.sort((a, b) => {
  const aDiff = Math.abs(a.capacity - requiredCapacity);
  const bDiff = Math.abs(b.capacity - requiredCapacity);
  return aDiff - bDiff;
});

// Example for capacity=100:
// 1. Venue with 100 capacity (diff=0)
// 2. Venue with 95 capacity (diff=5)
// 3. Venue with 110 capacity (diff=10)
// 4. Venue with 80 capacity (diff=20)
```

---

## 📊 User Experience Flow

### Before (Old Flow)
```
Step 1: Title + Description
Step 2: City + Venue + Capacity + Type + Category
       ❌ Too many fields
       ❌ No smart filtering
       ❌ All venues shown regardless of capacity
```

### After (New Flow)
```
Step 1: Title + Description + Type + Category + Capacity
       ✅ Logical grouping
       ✅ All event details collected first

Step 2: City + Venue
       ✅ Shows summary of Step 1 data
       ✅ Smart venue filtering
       ✅ Sorted by best match
       ✅ Capacity shown in venue name
       ✅ Only suitable venues displayed
```

---

## 🎨 UI Improvements

### Step 2 Summary Box
```
┌─────────────────────────────────────────────┐
│ Event Details from Step 1:                  │
│ Type: Conference                            │
│ Category: Business                          │
│ Capacity: 100                               │
│ Venues below are filtered based on these    │
│ criteria                                    │
└─────────────────────────────────────────────┘
```

### Venue Dropdown
```
Grand Conference Center (Capacity: 120)
Business Hotel (Capacity: 100)
City Convention Hall (Capacity: 150)
Downtown Meeting Space (Capacity: 85)
```

---

## 🔧 Technical Implementation

### File Modified
`/apps/web/components/events/EventFormSteps.tsx`

### Changes Made

**1. Schema Updates**
```typescript
// Before
const basicInfoSchema = z.object({
  title: string,
  description: string,
});

const eventDetailsSchema = z.object({
  city: string,
  venue: string,
  capacity: number,
  type: string,
  category: string,
});

// After
const basicInfoSchema = z.object({
  title: string,
  description: string,
  type: string,        // Moved here
  category: string,    // Moved here
  capacity: number,    // Moved here
});

const eventDetailsSchema = z.object({
  city: string,
  venue: string,
  // Removed: capacity, type, category
});
```

**2. BasicInfoStep - Added Fields**
- Event Type dropdown
- Category dropdown
- Capacity input with helper text

**3. EventDetailsStep - Enhanced**
- Receives type, category, capacity from initialData
- Shows summary box with Step 1 data
- Passes filters to venue search API
- Sorts venues by capacity match
- Removed duplicate fields

**4. Venue Search Enhancement**
```typescript
// Build query with filters
const params = new URLSearchParams({
  city: city,
  type: eventType.toLowerCase(),
  category: eventCategory.toLowerCase(),
  minCapacity: String(Math.floor(eventCapacity * 0.8)),
  maxCapacity: String(Math.ceil(eventCapacity * 1.5))
});

// Fetch filtered venues
const res = await fetch(`/api/venues/search?${params}`);

// Sort by best match
venues.sort((a, b) => {
  const aDiff = Math.abs(a.capacity - eventCapacity);
  const bDiff = Math.abs(b.capacity - eventCapacity);
  return aDiff - bDiff;
});
```

---

## 🚀 Benefits

### For Users
✅ **Logical Flow** - Event details first, then location
✅ **Smart Suggestions** - Only relevant venues shown
✅ **Time Saving** - No scrolling through unsuitable venues
✅ **Better Matches** - Venues sorted by suitability
✅ **Clear Context** - Summary shows what was entered

### For System
✅ **Better Data** - Type/category/capacity collected early
✅ **Efficient API** - Filtered queries reduce load
✅ **Scalable** - Easy to add more filters
✅ **Maintainable** - Clear separation of concerns

---

## 📱 Mobile Responsiveness

- Summary box stacks on mobile
- Dropdowns full-width on mobile
- Venue list scrollable
- Touch-friendly buttons

---

## 🧪 Testing Checklist

- [ ] Step 1: Enter title, description, type, category, capacity
- [ ] Click "Next" - should validate all fields
- [ ] Step 2: See summary of Step 1 data
- [ ] Enter city - should show city suggestions
- [ ] Select city - should trigger venue search
- [ ] Verify venues are filtered by capacity range
- [ ] Verify venues show capacity in name
- [ ] Verify venues sorted by best match
- [ ] Select venue - should populate coordinates
- [ ] Click "Next" - should proceed to Step 3

---

## 🔄 Data Flow

```
User Input (Step 1)
    ↓
{
  title: "Tech Conference 2025",
  description: "Annual tech event",
  type: "Conference",
  category: "Technology",
  capacity: 100
}
    ↓
Passed to Step 2 as initialData
    ↓
User enters city: "Mumbai"
    ↓
API Call: /api/venues/search?
  city=Mumbai&
  type=conference&
  category=technology&
  minCapacity=80&
  maxCapacity=150
    ↓
Filtered & Sorted Venues
    ↓
User selects venue
    ↓
Proceed to Step 3
```

---

## 🎯 Future Enhancements

- [ ] Add venue photos from OpenStreetMap
- [ ] Show venue rating/reviews
- [ ] Add distance from city center
- [ ] Show venue amenities (WiFi, parking, etc.)
- [ ] Add "No suitable venues" fallback with manual entry
- [ ] Cache venue results for faster loading
- [ ] Add venue availability calendar
- [ ] Integrate with booking systems

---

## ✅ Status

**Implemented**: ✅ Complete
**Tested**: Pending user testing
**Deployed**: Service restarted

**Ready to use!** Create a new event to see the improved flow.
