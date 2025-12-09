# Eventbrite API Integration Guide

## 🎯 Overview
Your Event Planner application now integrates with Eventbrite API to display thousands of real events from around the world in your Browse Events section.

## ✅ What's Been Implemented

### 1. **Eventbrite API Library** (`/apps/web/lib/eventbrite-api.ts`)
- Complete TypeScript API wrapper
- Search events by city or coordinates
- Filter by category, price, date range
- Automatic error handling
- Type-safe event data structures

### 2. **Enhanced Browse Events Page** (`/apps/web/app/explore/page.tsx`)
- **Dual Event Sources**: Shows both your platform events AND Eventbrite events
- **Smart City Integration**: Automatically uses the city selected by user on login
- **Advanced Filters**:
  - 📍 City selection (10 major Indian cities)
  - 🎭 Category filter (Music, Business, Food, Arts, Sports, etc.)
  - 💰 Price filter (All, Free, Paid)
  - 🔗 Toggle Eventbrite events on/off
- **Beautiful UI**: Modern card-based design with images, dates, venues, pricing
- **Responsive**: Works perfectly on mobile, tablet, and desktop

### 3. **Supported Categories**
- 🎵 Music
- 💼 Business & Corporate
- 🍽️ Food & Drink
- 👥 Community
- 🎨 Arts
- ⚽ Sports
- 💪 Health
- 🔬 Science & Tech
- 👨‍👩‍👧 Family
- 📚 Education
- 👗 Fashion

### 4. **Supported Cities**
- Mumbai
- Delhi
- Bangalore
- Chennai
- Kolkata
- Hyderabad
- Pune
- Ahmedabad
- Navi Mumbai
- Chandigarh

## 🚀 Setup Instructions

### Step 1: Get Eventbrite API Token

1. Go to: **https://www.eventbrite.com/account-settings/apps**
2. Log in or create a free Eventbrite account
3. Click **"Create New Key"** or **"Create Private Token"**
4. Fill in the form:
   - **Application Name**: "Event Planner" (or your app name)
   - **Application URL**: `http://localhost:3001` (for development)
   - **OAuth Redirect URI**: Leave blank for private token
5. Click **"Create Key"**
6. Copy your **Private Token** (it starts with your OAuth token)

### Step 2: Add Token to Environment Variables

1. Open `/apps/web/.env.local` (create if doesn't exist)
2. Add this line:
```bash
NEXT_PUBLIC_EVENTBRITE_TOKEN=YOUR_TOKEN_HERE
```

**Example:**
```bash
NEXT_PUBLIC_EVENTBRITE_TOKEN=ABCDEFGH123456789
```

### Step 3: Restart the Application

```bash
cd "/Users/rajasekar/Event Planner V1"
docker compose restart web
```

### Step 4: Test the Integration

1. Open: **http://localhost:3001/explore**
2. You should see:
   - Your platform events (top section)
   - Eventbrite events (bottom section)
3. Try the filters:
   - Change city
   - Select a category
   - Filter by price

## 📊 API Usage & Limits

### Free Tier Limits:
- **Rate Limit**: 1000 requests per hour
- **No Cost**: Completely free
- **Data Access**: Full event data including images, pricing, venues

### Best Practices:
- Events are cached in component state
- Only fetches when filters change
- Graceful error handling if API is down
- User can toggle Eventbrite events off

## 🎨 UI Features

### Your Platform Events Section:
- Shows events created on your platform
- Gradient background animations
- "LIVE" badge for active events
- Register and View Details buttons
- Filters by user's selected city

### Eventbrite Events Section:
- Real event images from Eventbrite
- Event name, date, time, venue
- Category badges
- Price display (Free, INR amounts, or "Check website")
- "SOLD OUT" badge for unavailable events
- "Online" badge for virtual events
- Direct link to Eventbrite for registration

## 🔧 Customization Options

### Add More Cities:
Edit `/apps/web/lib/eventbrite-api.ts`:
```typescript
export const CITY_COORDINATES = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'YourCity': { lat: XX.XXXX, lng: YY.YYYY }, // Add here
}
```

### Change Default City:
Edit `/apps/web/app/explore/page.tsx`:
```typescript
const [selectedCity, setSelectedCity] = useState('YourCity')
```

### Modify Filters:
The filters are in the `<select>` elements in the page. You can:
- Add/remove cities
- Add/remove categories
- Change default selections

## 📝 API Response Structure

Each Eventbrite event includes:
```typescript
{
  id: string
  name: string
  description: string
  startDate: string          // "2024-11-15"
  startTime: string          // "19:00"
  venue: {
    name: string
    address: string
    city: string
    latitude: number
    longitude: number
  }
  isFree: boolean
  priceDisplay: string       // "Free" or "INR 500 - 2000"
  image: string              // Event image URL
  url: string                // Eventbrite event page
  category: string           // "Music", "Business", etc.
  isOnline: boolean
  isSoldOut: boolean
}
```

## 🐛 Troubleshooting

### Problem: "Invalid Eventbrite API token"
**Solution**: 
- Check your token in `.env.local`
- Make sure it starts with `NEXT_PUBLIC_`
- Restart the app: `docker compose restart web`

### Problem: "No events found"
**Solution**:
- Try a different city (some cities have more events)
- Change category to "All Categories"
- Set price to "All Events"
- Check if Eventbrite has events in that city

### Problem: "Rate limit exceeded"
**Solution**:
- Wait 1 hour (free tier resets hourly)
- Reduce filter changes
- Consider caching events longer

### Problem: Events not loading
**Solution**:
- Check browser console for errors
- Verify internet connection
- Check if Eventbrite API is operational
- Try toggling "Show Eventbrite Events" off and on

## 📚 API Documentation

Full Eventbrite API docs: **https://www.eventbrite.com/platform/api**

### Useful Endpoints:
- Search Events: `GET /events/search/`
- Get Event Details: `GET /events/{id}/`
- Get Categories: `GET /categories/`

## 🎯 Future Enhancements

Possible additions:
1. **Save Favorite Events**: Let users bookmark events
2. **Event Recommendations**: AI-based suggestions
3. **Calendar Integration**: Add events to Google Calendar
4. **Social Sharing**: Share events on social media
5. **Event Reminders**: Email/SMS notifications
6. **Multi-Source**: Add Ticketmaster, PredictHQ APIs
7. **Advanced Search**: Search by keyword, date range
8. **Map View**: Show events on a map

## 💡 Tips

1. **Use Coordinates**: Searching by lat/lng is more accurate than city name
2. **Cache Results**: Consider adding Redis caching for popular searches
3. **Pagination**: Implement "Load More" for better UX
4. **Error Boundaries**: Add React error boundaries for robustness
5. **Analytics**: Track which events users click on

## 📞 Support

If you need help:
1. Check Eventbrite API status: https://status.eventbrite.com/
2. Review API docs: https://www.eventbrite.com/platform/docs/
3. Check browser console for errors
4. Verify environment variables are set correctly

---

## ✅ Integration Complete!

Your Event Planner now has access to thousands of real events from Eventbrite. Users can:
- Browse events in their selected city
- Filter by category and price
- See both your platform events and Eventbrite events
- Register for events directly on Eventbrite

**Enjoy your enhanced event discovery experience!** 🎉
