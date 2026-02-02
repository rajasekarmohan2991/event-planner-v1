# Production Database Issue - Event 20 Missing

## The Problem

You're testing with **Event ID 20**, but:
- ✅ Event 20 EXISTS in your **local database**
- ❌ Event 20 does NOT exist in your **production database** (Vercel)

This is why you're getting:
- Floor plan: `404 - Event not found`
- Registrations: Not saving (event doesn't exist)

## Your Databases Are Different

You have **TWO separate databases**:

### Local Database (Your Computer)
- Connected via `DATABASE_URL` in your local `.env` file
- Has Event 20
- Used when running `npm run dev`

### Production Database (Vercel)
- Connected via `DATABASE_URL` environment variable in Vercel
- Does NOT have Event 20
- Used when accessing https://aypheneventplanner.vercel.app

## Solutions

### Option 1: Create Event 20 in Production ✅ (Recommended)

You need to create Event 20 in your production database. You can do this by:

**A. Using the Production UI:**
1. Go to https://aypheneventplanner.vercel.app
2. Login to your account
3. Go to Events → Create New Event
4. Create an event (it will get an auto-generated ID)
5. Note the event ID from the URL
6. Use THAT event ID for testing (not necessarily 20)

**B. Or check what events already exist in production:**
1. Go to https://aypheneventplanner.vercel.app/events
2. Click on any existing event
3. Note the event ID from the URL (e.g., `/events/123`)
4. Use that event ID for testing

### Option 2: Test Locally Instead

Since Event 20 exists in your local database:

1. Start local server:
   ```bash
   cd "/Users/rajasekar/Event Planner V1/apps/web"
   npm run dev
   ```

2. Open http://localhost:3001
3. Use Event 20 there
4. Everything will work because Event 20 exists locally

### Option 3: Sync Databases (Advanced)

If you want Event 20 in both databases, you can:

1. **Export from local:**
   ```sql
   SELECT * FROM events WHERE id = 20;
   ```

2. **Import to production** (requires database access)

**Note:** This is complex and not recommended unless you're familiar with database operations.

## Why This Happened

When you:
- Created Event 20 locally (using local dev server)
- It was saved to your LOCAL database
- Your PRODUCTION database never got this event
- The two databases are completely separate

## Recommended Action

**Use an event that exists in BOTH databases:**

1. Create a new event in production UI
2. Note its ID (let's say it's ID 25)
3. Test with Event 25 instead of Event 20
4. All features will work (registrations, floor plan, etc.)

OR

**Test everything locally:**
1. Run `npm run dev`
2. Use http://localhost:3001
3. Test with Event 20
4. Everything works because Event 20 exists locally

## How to Check What Events Exist in Production

You can't easily query the production database directly, but you can:

1. **Via UI:** Go to https://aypheneventplanner.vercel.app/events
2. **Via API:** Check the network tab when loading events list
3. **Create a new event:** Just create one and use its ID

## Summary

**The registration and floor plan APIs are working correctly!**

The issue is simply that **Event 20 doesn't exist in your production database**.

**Quick Fix:**
1. Go to production site
2. Create a new event (or use an existing one)
3. Test with that event's ID
4. Everything will work! ✅
