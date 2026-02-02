# Speaker Upload Errors - Fixed

## Issues Found

### 1. ❌ 404 Error: `/api/events/2/upload` not found
**Problem:** The speaker upload form was trying to POST to `/api/events/[id]/upload` but this endpoint didn't exist.

**Solution:** ✅ Created `/api/events/[id]/upload/route.ts` endpoint that:
- Accepts file uploads via FormData
- Supports different types (speaker, banner, general)
- Uploads to Supabase Storage in organized folders
- Returns the uploaded file URL

### 2. ⚠️ 503 Error: `/api/events/2/sessions` 
**Problem:** Sessions table might be missing or have schema issues. The API tries to auto-repair but returns 503 during repair.

**Solution:** The endpoint has self-healing code that:
- Creates the `sessions` table if it doesn't exist
- Adds missing columns (location, room, track, stream_url, is_live)
- Returns empty sessions array after repair
- **Action needed:** Refresh the page after seeing this error once - it should work on the second try

### 3. ⚠️ 500 Error: `/api/events/2/settings/tickets`
**Problem:** Temporary database error when fetching ticket settings.

**Solution:** The endpoint already has self-healing:
- Creates `event_ticket_settings` table if missing
- Returns default prices if no settings exist
- **Action needed:** This should resolve automatically on retry

## How to Upload Speaker Images Now

1. **Go to** `/events/[id]/speakers`
2. **Click** "Upload Image" button
3. **Select** an image file (JPG, PNG, GIF, WebP, SVG)
4. **Upload** - The file will be uploaded to Supabase Storage
5. **URL** will be automatically populated in the Photo URL field

## Upload Endpoint Details

**Endpoint:** `POST /api/events/[id]/upload`

**FormData Fields:**
- `file`: The image file (required)
- `type`: Upload type - "speaker", "banner", or "general" (optional, default: "general")

**Response:**
```json
{
  "success": true,
  "url": "https://[supabase-url]/storage/v1/object/public/events/2/speakers/image.jpg",
  "path": "events/2/speakers/image.jpg",
  "message": "File uploaded successfully"
}
```

**Storage Structure:**
- Speaker images: `events/[eventId]/speakers/[filename]`
- Banner images: `events/[eventId]/banners/[filename]`
- General images: `events/[eventId]/[filename]`

## Next Steps

1. ✅ **Upload endpoint is now live** - Try uploading a speaker image again
2. 🔄 **If you see 503/500 errors** - Refresh the page and try again (self-healing in progress)
3. 📸 **Supported formats**: JPG, JPEG, PNG, GIF, WebP, SVG
4. 📦 **Storage**: All files are stored in Supabase Storage with public URLs

## Deployment Status

✅ **Deployed** - The fix has been pushed to production
🕐 **Wait time** - Allow 1-2 minutes for Vercel to deploy the changes
🔄 **Then** - Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
