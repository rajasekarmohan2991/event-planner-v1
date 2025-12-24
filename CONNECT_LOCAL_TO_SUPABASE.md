# FIX: Connect Local Development to Supabase (Production Database)

## The Problem

Currently:
- ❌ Your local `.env` file points to a **local PostgreSQL database** (`localhost:5432`)
- ❌ When you test locally, registrations save to **local database**
- ✅ Production (Vercel) uses **Supabase database**
- ✅ When you test on https://aypheneventplanner.vercel.app, it uses Supabase

**Result:** You have TWO separate databases with different data!

## The Solution

Update your local `.env` file to use the **same Supabase database** as production.

---

## Step 1: Get Your Supabase Database URL

### Option A: From Supabase Dashboard

1. Go to **https://app.supabase.com**
2. Select your project
3. Go to **Settings** (gear icon) → **Database**
4. Scroll to **Connection String**
5. Select **URI** tab
6. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
7. **Replace `[YOUR-PASSWORD]` with your actual database password**

### Option B: From Vercel (Easier)

1. Go to **https://vercel.com/dashboard**
2. Select your project: **aypheneventplanner**
3. Go to **Settings** → **Environment Variables**
4. Find **DATABASE_URL**
5. Click **"Show"** to reveal the value
6. **Copy the entire URL**

---

## Step 2: Update Your Local .env File

1. Open your local `.env` file:
   ```bash
   cd "/Users/rajasekar/Event Planner V1/apps/web"
   open .env
   ```

2. Find this line:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/event_planner"
   ```

3. Replace it with your Supabase URL:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres"
   ```

4. **Save the file**

---

## Step 3: Restart Your Development Server

If you have the dev server running:

1. **Stop it** (press `Ctrl+C` in the terminal)
2. **Start it again**:
   ```bash
   cd "/Users/rajasekar/Event Planner V1/apps/web"
   npm run dev
   ```

---

## Step 4: Verify It's Working

1. Open **http://localhost:3001**
2. Go to Event 20 (or any event)
3. Create a registration
4. Check the registration list
5. ✅ Registration should appear!

Now both local and production use the **same Supabase database**!

---

## What This Fixes

After updating to Supabase:

✅ **Local testing uses production database**  
✅ **Registrations save to Supabase** (not local DB)  
✅ **Same data everywhere** (local and production)  
✅ **Event 20 exists** (if it's in Supabase)  
✅ **No more database mismatch**  

---

## Important Notes

### Security
- ✅ Your `.env` file is in `.gitignore` - it won't be committed
- ✅ Never share your database password publicly
- ✅ Use different passwords for dev/prod if needed

### Database Changes
- ⚠️ Any changes you make locally will affect production!
- ⚠️ Be careful when testing destructive operations
- 💡 Consider using a separate Supabase project for development

---

## Alternative: Keep Separate Databases

If you want to keep local and production databases separate:

### Option 1: Use Supabase for Production Only
- Keep local `.env` pointing to local PostgreSQL
- Only test production features on https://aypheneventplanner.vercel.app
- Accept that local and production have different data

### Option 2: Create a Dev Supabase Project
1. Create a second Supabase project for development
2. Use that URL in your local `.env`
3. Production uses the main Supabase project
4. Both use Supabase, but different databases

---

## Recommended Setup

**For your use case (testing in production):**

1. ✅ Update local `.env` to use Supabase
2. ✅ Test locally with `npm run dev`
3. ✅ All data goes to Supabase
4. ✅ Production and local use same database
5. ✅ No confusion about where data is stored!

---

## Quick Command

To update your `.env` file quickly:

```bash
cd "/Users/rajasekar/Event Planner V1/apps/web"

# Backup current .env
cp .env .env.backup

# Edit .env
nano .env
# or
code .env
# or
open .env
```

Then update the `DATABASE_URL` line and save!

---

## Summary

**Current Setup:**
- Local → Local PostgreSQL (`localhost:5432`)
- Production → Supabase

**Recommended Setup:**
- Local → Supabase
- Production → Supabase
- ✅ Same database everywhere!

Just update your local `.env` file with the Supabase DATABASE_URL and restart your dev server! 🚀
