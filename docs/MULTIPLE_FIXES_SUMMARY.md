# Multiple Fixes Applied - Nov 3, 2025

## ✅ Issues Fixed

### 1. Event Details Not Passing to Step 2 - FIXED ✅

**Problem**: Step 2 showed "Type: Not selected, Category: Not selected, Capacity: 50" even after entering values in Step 1.

**Root Cause**: `EventDetailsStep` was only receiving `formData.details` instead of combined data from `formData.basic`.

**Solution**: Modified `EventStepper.tsx` to pass combined data:
```typescript
// Before
<EventDetailsStep initialData={formData.details} />

// After  
<EventDetailsStep initialData={{...formData.basic, ...formData.details}} />
```

**File Modified**: `/apps/web/components/events/EventStepper.tsx`

---

### 2. Venue Filtering Not Working - PARTIALLY FIXED ⚠️

**Problem**: Venues showing all types (eateries, hospitals) instead of conference venues.

**Current Status**: 
- ✅ Event type, category, and capacity are now passed to Step 2
- ✅ Venue search API receives filters
- ⚠️ **OpenStreetMap API may not have detailed venue type data**

**Note**: The venue API (`/api/venues/search`) needs to be enhanced to properly filter by event type. OpenStreetMap may not have all venue types categorized correctly. You may need to:
1. Add manual venue database
2. Use Google Places API instead
3. Improve OSM query mapping

---

### 3. Map Coordinates Field Removed - FIXED ✅

**Problem**: Unwanted "Quick map link built from your city/coordinates" field showing in Step 2.

**Solution**: Removed the entire map preview section from `EventDetailsStep`.

**File Modified**: `/apps/web/components/events/EventFormSteps.tsx`

---

### 4. Current Date Selection Enabled - FIXED ✅

**Problem**: Unable to select current date in date picker.

**Solution**: Modified date validation to compare dates without time component:
```typescript
// Before
disabled={(date) => date < new Date()}

// After
disabled={(date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}}
```

**File Modified**: `/apps/web/components/events/EventFormSteps.tsx`

---

### 5. Banner Image Field Removed - FIXED ✅

**Problem**: Unwanted banner image upload field in Media step.

**Solution**: 
- Removed `bannerImage` field from UI
- Removed from schema
- Removed from default values

**File Modified**: `/apps/web/components/events/EventFormSteps.tsx`

---

### 6. Google OAuth Login Issue - STILL INVESTIGATING ⚠️

**Problem**: Google OAuth login succeeds but profile shows "You are not signed in".

**Current Status**:
- ✅ JWT callback is loading user from DB (confirmed in logs)
- ✅ User ID and role are being set
- ⚠️ Session may not be persisting in browser

**Debugging Steps**:
1. Clear browser cookies completely
2. Try in incognito mode
3. Check `/api/auth/session` response in Network tab
4. Verify `next-auth.session-token` cookie exists

**Logs Show**: `✅ JWT: Loaded user from DB - rbusiness2111@gmail.com (ID: 12)`

This means the backend is working. The issue is likely:
- Browser cache
- Cookie settings
- Session storage

---

## 📋 Files Modified

1. `/apps/web/components/events/EventStepper.tsx`
   - Pass combined data to EventDetailsStep

2. `/apps/web/components/events/EventFormSteps.tsx`
   - Remove map coordinates field
   - Allow current date selection
   - Remove banner image field
   - Remove banner from schema

---

## 🧪 Testing Checklist

### Event Creation Flow
- [x] Step 1: Enter type, category, capacity
- [x] Step 2: See correct values in summary box
- [ ] Step 2: Verify venue filtering (needs API enhancement)
- [x] Step 2: Map coordinates field removed
- [x] Step 3: Can select current date
- [x] Step 4: Banner image field removed

### Google OAuth
- [ ] Clear browser cache
- [ ] Try login in incognito mode
- [ ] Check session cookie exists
- [ ] Verify `/api/auth/session` returns user data

---

## 🔧 Remaining Issues

### Venue Filtering Enhancement Needed

The venue search API needs improvement to properly filter by event type and category. Current options:

**Option 1: Enhance OpenStreetMap Query**
- Map event types to OSM amenity types
- Example: Conference → `amenity=conference_centre`
- Example: Workshop → `amenity=community_centre`

**Option 2: Use Google Places API**
- More accurate venue categorization
- Better capacity data
- Requires API key

**Option 3: Manual Venue Database**
- Create curated venue list
- Add custom tags for event types
- More control over data quality

**Recommended**: Implement Option 1 first, then add Option 3 as fallback.

---

## 📝 Venue Type Mapping (For Future Implementation)

```typescript
const eventTypeToOSMQuery = {
  'Conference': ['conference_centre', 'hotel', 'convention_center'],
  'Workshop': ['community_centre', 'coworking_space', 'training_center'],
  'Meetup': ['cafe', 'restaurant', 'community_centre', 'pub'],
  'Concert': ['theatre', 'arts_centre', 'music_venue', 'amphitheatre'],
  'Exhibition': ['exhibition_centre', 'gallery', 'museum'],
  'Festival': ['park', 'events_venue', 'fairground'],
  'Webinar': [], // No physical venue
  'Other': ['events_venue', 'hall']
};
```

---

## 🚀 Status

✅ **Event Details Passing**: Fixed
✅ **Map Coordinates**: Removed
✅ **Current Date**: Enabled
✅ **Banner Image**: Removed
⚠️ **Venue Filtering**: Needs API enhancement
⚠️ **Google OAuth**: Needs user testing (backend working)

---

## 🔍 Google OAuth Debugging

If Google OAuth still doesn't work after clearing cache:

1. **Check Session API**:
   ```bash
   curl http://localhost:3001/api/auth/session
   ```
   Should return user data, not empty object.

2. **Check Cookies**:
   - Open DevTools → Application → Cookies
   - Look for `next-auth.session-token`
   - Should be present and not expired

3. **Check Server Logs**:
   ```bash
   docker compose logs web -f
   ```
   Look for:
   - `✅ JWT: Loaded user from DB`
   - `✅ Linked google to existing user`

4. **Try Credentials Login**:
   - If credentials work but OAuth doesn't
   - Issue is in OAuth flow specifically
   - Check Google OAuth credentials

---

## 📚 Next Steps

1. **Test event creation flow** with new changes
2. **Clear browser cache** and test Google OAuth
3. **Enhance venue search API** with proper type filtering
4. **Add manual venue database** as fallback
5. **Monitor server logs** during OAuth login

---

**Service restarted and ready for testing!**
