# Venue Suggestions API Setup

## ✅ What's Integrated

The venue suggestions now support **Google Places API** (primary) with fallback to Nominatim + OpenTripMap.

### File: `apps/web/app/api/geo/places/route.ts`

## 🔑 Get Google Places API Key (FREE)

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable billing (required but free tier is generous)

### Step 2: Enable Places API
1. Go to **APIs & Services** → **Library**
2. Search for "Places API"
3. Click **Enable**

### Step 3: Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the key
4. **Restrict the key** (recommended):
   - Application restrictions: HTTP referrers or IP addresses
   - API restrictions: Select "Places API"

### Step 4: Add to Environment
```bash
# In apps/web/.env.local
GOOGLE_PLACES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 5: Rebuild Docker
```bash
# From project root
docker compose down
docker compose build --no-cache web
docker compose up -d
```

## 💰 Pricing (Free Tier)

Google Places API Free Tier:
- **$200 free credit per month**
- Text Search: $32 per 1000 requests
- **~6,250 free searches/month**
- More than enough for development and small production

## 🎯 How It Works

### With Google Places API Key:
1. User types city (e.g., "Chennai", "Atlanta, Georgia")
2. User clicks Venue field
3. API searches: `"convention center auditorium hall venue in {city}"`
4. Returns real venues with:
   - Name
   - Full address
   - Lat/Lon coordinates
   - Google Place ID

### Without API Key (Fallback):
- Uses OpenStreetMap Nominatim (free, no key)
- Uses OpenTripMap if `OPENTRIPMAP_API_KEY` set
- Less accurate but still functional

## 🧪 Test It

1. Add `GOOGLE_PLACES_API_KEY` to `apps/web/.env.local`
2. Rebuild: `docker compose build --no-cache web && docker compose up -d`
3. Open http://localhost:3000/events/new
4. Enter city: "Chennai" or "New York"
5. Click Venue field
6. Should see real venues instantly

## 📊 API Response Example

```json
{
  "items": [
    {
      "id": "ChIJ...",
      "name": "Chennai Trade Centre",
      "displayName": "Chennai Trade Centre, Nandambakkam, Chennai, Tamil Nadu, India",
      "lat": 13.0067,
      "lon": 80.2206,
      "address": "Chennai Trade Centre, Nandambakkam, Chennai, Tamil Nadu, India",
      "city": "Chennai"
    }
  ],
  "source": "google"
}
```

## 🔧 Troubleshooting

### No venues showing:
1. Check API key is in `.env.local`
2. Verify Places API is enabled in Google Cloud Console
3. Check browser console for errors
4. Tail logs: `docker compose logs -f web`

### "OVER_QUERY_LIMIT":
- You've exceeded free tier
- Add billing or wait for monthly reset

### "REQUEST_DENIED":
- API key restrictions too strict
- Check key has Places API enabled
- Verify HTTP referrer/IP restrictions

## 🌍 Global Coverage

Google Places works worldwide:
- ✅ Chennai, India
- ✅ Atlanta, Georgia, USA
- ✅ London, UK
- ✅ Tokyo, Japan
- ✅ Sydney, Australia
- ✅ Any city globally

## 🚀 Next Steps

1. Get your Google Places API key
2. Add to `.env.local`
3. Rebuild Docker
4. Test venue suggestions
5. Monitor usage in Google Cloud Console

## 📝 Alternative: OpenTripMap (Optional)

If you prefer OpenTripMap:
1. Get free key at https://opentripmap.io/product
2. Add `OPENTRIPMAP_API_KEY=xxx` to `.env.local`
3. Rebuild

Both can work together (Google primary, OTM fallback).
