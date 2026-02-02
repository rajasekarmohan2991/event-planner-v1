# Fix Image Upload Preview (414 Error)

## The Problem

**Error 414: URI Too Long** happens when:
- Image is uploaded successfully ✅
- But stored as data URL (base64) instead of Blob URL
- Data URL is too long for browser to display
- Preview fails to load ❌

## Root Cause

**Vercel Blob Storage is not configured**

The upload API falls back to data URLs when `BLOB_READ_WRITE_TOKEN` is missing.

## The Solution

### Configure Vercel Blob Storage

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **Create Blob Storage**
   - Click **Storage** tab
   - Click **Create Database**
   - Select **Blob**
   - Click **Create**

3. **Auto-Configuration**
   - Vercel automatically adds `BLOB_READ_WRITE_TOKEN` to your environment variables
   - No manual configuration needed!

4. **Redeploy**
   - Vercel will automatically redeploy
   - Or manually redeploy from Deployments tab

## After Configuration

### What Changes:

**Before (Data URL):**
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD... (very long)
```
❌ Too long for preview (414 error)

**After (Blob URL):**
```
https://abc123.public.blob.vercel-storage.com/image-xyz.jpg
```
✅ Short URL, works perfectly

### Benefits:

- ✅ Fast image loading
- ✅ CDN delivery
- ✅ No size limits
- ✅ Preview works
- ✅ Professional URLs

## Testing

After Blob is configured:

1. **Create Event**
2. **Upload Image**
3. **See Preview** immediately ✅
4. **Check URL** - should be `blob.vercel-storage.com`

## Temporary Workaround

If you can't set up Blob right now:

**Only upload small images:**
- Max size: 100KB
- Compress images before upload
- Use PNG/JPG with low quality

But this is **NOT recommended** for production!

## Verification

Check if Blob is configured:

1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Look for `BLOB_READ_WRITE_TOKEN`
4. If it exists ✅ you're good!

## Cost

Vercel Blob Storage:
- **Free tier**: 500MB storage, 5GB bandwidth/month
- **More than enough** for most event images
- Scales automatically

---

**Bottom Line**: Set up Vercel Blob Storage to fix image preview! 🚀
