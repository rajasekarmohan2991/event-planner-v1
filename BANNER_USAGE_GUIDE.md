# Event Banner Usage Guide

## Where the Banner is Saved

When you upload a banner in the Banner Generator (`/events/[id]/design/banner`), it's saved to:

**Database**: `events` table
**Column**: `banner_url` (character varying)

Example:
```sql
SELECT banner_url FROM events WHERE id = 17;
-- Returns: https://your-storage.com/banners/event-17-banner.jpg
```

## Where to Use the Banner

### 1. Event Details Page
Display the banner at the top of the event details page.

**File**: `/apps/web/app/events/[id]/page.tsx` or similar

```tsx
// Fetch event data
const event = await fetch(`/api/events/${id}`).then(r => r.json())

// Display banner
{event.banner_url && (
  <div className="w-full h-64 relative">
    <img 
      src={event.banner_url} 
      alt={event.name}
      className="w-full h-full object-cover"
    />
  </div>
)}
```

### 2. Registration Page
Show the banner on the registration/ticket purchase page.

**File**: `/apps/web/app/events/[id]/register/page.tsx`

```tsx
<div className="banner-section">
  {event.bannerUrl && (
    <img src={event.bannerUrl} alt="Event Banner" />
  )}
</div>
```

### 3. Event Card (List View)
Use as thumbnail in event listings.

```tsx
<div className="event-card">
  <img 
    src={event.banner_url || '/default-banner.jpg'} 
    alt={event.name}
    className="w-full h-48 object-cover"
  />
  <h3>{event.name}</h3>
</div>
```

### 4. Email Templates
Include in event confirmation emails.

```html
<img src="{{event.banner_url}}" alt="Event Banner" style="width: 100%; max-width: 600px;" />
```

### 5. Social Media Sharing
Use as Open Graph image for social sharing.

```tsx
<meta property="og:image" content={event.banner_url} />
<meta name="twitter:image" content={event.banner_url} />
```

## API Response

When you fetch event data, the banner is included:

```json
{
  "id": "17",
  "name": "Tech Conference 2024",
  "banner_url": "https://storage.com/banners/event-17.jpg",
  ...
}
```

## Example Implementation

```tsx
'use client'

import { useEffect, useState } from 'react'

export default function EventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then(r => r.json())
      .then(data => setEvent(data))
  }, [params.id])

  if (!event) return <div>Loading...</div>

  return (
    <div>
      {/* Banner Section */}
      {event.banner_url && (
        <div className="relative w-full h-80 mb-8">
          <img 
            src={event.banner_url}
            alt={event.name}
            className="w-full h-full object-cover rounded-lg shadow-lg"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-8">
            <h1 className="text-4xl font-bold text-white">{event.name}</h1>
          </div>
        </div>
      )}
      
      {/* Rest of event content */}
      <div className="event-details">
        {/* ... */}
      </div>
    </div>
  )
}
```

## Changes Made

✅ **Removed**: "Theme & Branding" card from Design module
✅ **Kept**: Banner Generator, Floor Plan Generator
✅ **Banner**: Saved in `events.banner_url` column

The banner is now ready to use anywhere in your application!
