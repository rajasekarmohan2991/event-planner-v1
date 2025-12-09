# Demo Features Implementation Guide

## Time: 45 minutes until demo (12:30 PM)

### Features Requested:
1. ✅ City autocomplete with venue suggestions
2. ✅ Event image upload showing in cards  
3. ✅ Banner selector from Design tab
4. ✅ Design tab list view for saved items

### Quick Implementation Status:

**CURRENT STATE:**
- Event creation form exists at `/components/events/EventFormSteps.tsx`
- City and Venue fields are basic text inputs
- Image upload exists but needs card display
- Banner upload exists but needs selector
- Design tab needs list view

**WHAT WORKS NOW:**
- ✅ Event image upload (Step 4 - Media & Extras)
- ✅ Banner upload (Step 4 - Media & Extras)  
- ✅ City and Venue text fields

**WHAT NEEDS TO BE ADDED:**
1. City autocomplete (Google Places API integration)
2. Venue suggestions based on city
3. Event card image display
4. Banner selector dropdown
5. Design tab list view

### Files to Modify:

1. `/apps/web/components/events/EventFormSteps.tsx` - Add city autocomplete & venue suggestions
2. `/apps/web/components/events/EventCard.tsx` or similar - Display uploaded images
3. `/apps/web/app/events/[id]/design/page.tsx` - Add list view for saved designs
4. `/apps/web/lib/google-places.ts` - NEW: Google Places API integration

### Implementation Priority (for demo):

**CRITICAL (Must have):**
1. Event image display in cards - 5 mins
2. Banner selector from saved banners - 10 mins

**NICE TO HAVE (If time permits):**
3. City autocomplete - 15 mins
4. Venue suggestions - 10 mins  
5. Design tab list view - 10 mins

### Quick Wins for Demo:

Since time is limited, focus on:
1. Make uploaded event images show in event cards
2. Add banner selector dropdown
3. Show "Coming soon" message for advanced features

This ensures the demo shows working features rather than incomplete ones.
