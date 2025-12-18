# 🔧 Supabase Configuration Setup Guide

## Required Environment Variables

Add these to your `.env.local` file and Vercel environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## How to Get Supabase Credentials

### Step 1: Get Supabase URL and Anon Key

1. **Go to your Supabase project dashboard**
2. **Click on "Settings"** (gear icon in sidebar)
3. **Click on "API"**
4. **Copy the following:**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Configure Storage Bucket

Your bucket "uploads" is already created! ✅

**Make sure it's PUBLIC:**
1. Go to **Storage** in Supabase dashboard
2. Click on **"uploads"** bucket
3. Click **"Settings"** or **"Policies"**
4. Ensure **"Public bucket"** is enabled

**Or add these RLS policies:**

```sql
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploads' );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'uploads' AND auth.role() = 'authenticated' );

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'uploads' );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING ( bucket_id = 'uploads' );
```

---

## Add to Vercel

### Option 1: Via Vercel Dashboard

1. Go to your Vercel project
2. Click **"Settings"**
3. Click **"Environment Variables"**
4. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your_url
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your_key
5. Click **"Save"**
6. **Redeploy** your application

### Option 2: Via Vercel CLI

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Testing the Upload

### Test via API:

```bash
curl -X POST https://your-app.vercel.app/api/upload/image \
  -F "file=@/path/to/image.jpg" \
  -F "folder=events"
```

### Expected Response:

```json
{
  "success": true,
  "url": "https://your-project.supabase.co/storage/v1/object/public/uploads/events/1234567890-abc123.jpg",
  "path": "events/1234567890-abc123.jpg",
  "message": "File uploaded successfully"
}
```

---

## File Structure in Supabase

```
uploads/
├── events/
│   ├── 1234567890-abc123.jpg
│   ├── 1234567891-def456.png
│   └── ...
├── profiles/
│   └── ...
└── attachments/
    └── ...
```

---

## Troubleshooting

### Error: "Invalid API key"
- Check that `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Make sure you're using the **anon public** key, not the service role key

### Error: "Bucket not found"
- Verify bucket name is exactly "uploads" (case-sensitive)
- Check bucket exists in Supabase Storage

### Error: "Permission denied"
- Make bucket public OR
- Add RLS policies (see above)

### Error: "File too large"
- Default limit is 50MB
- Increase in Supabase Storage settings if needed

---

## Security Notes

✅ **NEXT_PUBLIC_*** variables are safe to expose (they're public)
✅ **anon key** is meant to be public
❌ **Never expose service_role key** in frontend code
✅ Use RLS policies to control access

---

## Next Steps

1. ✅ Add environment variables to `.env.local`
2. ✅ Add environment variables to Vercel
3. ✅ Ensure "uploads" bucket is public
4. ✅ Redeploy application
5. ✅ Test image upload in Create Event form

**All code is ready!** Just add the environment variables and redeploy. 🚀
