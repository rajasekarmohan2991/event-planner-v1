# CRITICAL: Production Database Mismatch

## The Problem

The floor plan API returns: `{"message":"Event not found"}`

This means:
- ✅ The API route is working (not a 404 routing error)
- ✅ The params handling is correct
- ❌ Event 20 does NOT exist in the database that **production** is using

## Why This Happens

You have **MULTIPLE databases**:

### 1. Local Database (Your Computer)
- What you connect to when running `npm run dev`
- Uses DATABASE_URL from your local `.env` file
- You updated this to point to Supabase ✅

### 2. Production Database (Vercel)
- What production uses at https://aypheneventplanner.vercel.app
- Uses DATABASE_URL from **Vercel environment variables**
- This might be pointing to a DIFFERENT database!

## The Issue

**Your production (Vercel) might be using a different database than Supabase!**

Possibilities:
1. Vercel has a different DATABASE_URL set
2. Vercel is using a different Supabase project
3. Vercel is using a different PostgreSQL database entirely

## How to Fix

### Step 1: Check Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your project: **aypheneventplanner**
3. Go to: **Settings** → **Environment Variables**
4. Find: **DATABASE_URL**
5. Click **"Show"** to see the value

### Step 2: Verify It's the Same Database

The DATABASE_URL in Vercel should be:
- **Same as your local .env** (if you want same database)
- **Points to Supabase** (if that's your production database)

Example Supabase URL:
```
postgresql://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres
```

### Step 3: Update Vercel DATABASE_URL (If Needed)

If Vercel's DATABASE_URL is different:

1. In Vercel dashboard → Settings → Environment Variables
2. Find DATABASE_URL
3. Click **"Edit"**
4. Update to your Supabase URL
5. Click **"Save"**
6. **Redeploy** the application

### Step 4: Create Event 20 in Production Database

If Vercel is using a different database, you need to create Event 20 there:

**Option A: Via Production UI**
1. Go to: https://aypheneventplanner.vercel.app
2. Login
3. Create a new event
4. Note the event ID
5. Use that ID for testing (doesn't have to be 20)

**Option B: Via Database**
1. Connect to the production database directly
2. Run SQL to create Event 20
3. Or use the diagnostic scripts with production DATABASE_URL

## Quick Diagnostic

Run this to see which database production is using:

1. Add a temporary API endpoint to show database info
2. Or check Vercel logs to see connection strings
3. Or create a test event in production UI and see where it goes

## Most Likely Solution

**Create a new event via production UI:**

1. Go to: https://aypheneventplanner.vercel.app
2. Login
3. Go to Events → Create New Event
4. Fill in details and save
5. Note the event ID (e.g., 25)
6. Use that event for testing:
   - Floor plan: `/events/25/design/floor-plan`
   - Registrations: `/events/25/register`
   - Communication: `/events/25/communicate`

This way you don't need to worry about Event 20 specifically!

## Summary

**The issue:** Production database ≠ Supabase database with Event 20

**The fix:** 
1. Check Vercel DATABASE_URL
2. Make sure it points to Supabase
3. OR create a new event in production
4. Use that event's ID for testing

**Easiest solution:** Just create a new event in production UI and use its ID! 🚀
