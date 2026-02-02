# Production Deployment Guide - Event 20 Setup

## Current Situation

- ✅ All code fixes are deployed to Vercel
- ✅ Event 20 exists in LOCAL database
- ❌ Event 20 does NOT exist in PRODUCTION database
- ❌ This is why registrations and floor plan don't work in production

## Solution: Create Event 20 in Production

You have **TWO options**:

---

## Option 1: Create Event 20 via Production UI ✅ (EASIEST)

This is the safest and easiest way:

### Steps:

1. **Go to production site:**
   - Open: https://aypheneventplanner.vercel.app

2. **Login to your account**

3. **Create Event 20:**
   - Go to **Events** page
   - Click **"Create New Event"** or **"+ New Event"**
   - Fill in the form:
     - **Name:** Test Event 20
     - **Slug:** test-event-20
     - **Description:** Test event for production
     - **Venue:** Test Venue
     - **Capacity:** 100
     - **Start Date:** Any future date
     - **End Date:** Any future date
     - **Status:** Published
     - **Visibility:** Public
   - Click **Save/Create**

4. **Note the Event ID:**
   - After creation, check the URL
   - It will show `/events/[ID]`
   - If it's not ID 20, that's okay! Use whatever ID it created

5. **Use that Event ID for testing:**
   - Registrations: `/events/[ID]/register`
   - Floor plan: `/events/[ID]/design/floor-plan`
   - Registration list: `/events/[ID]/registrations`

---

## Option 2: Direct Database Access (ADVANCED)

If you have direct access to your production database:

### A. Via Database Management Tool (e.g., pgAdmin, TablePlus)

1. Connect to your production database using the credentials from Vercel
2. Run this SQL:

```sql
-- First, get a tenant ID
SELECT id FROM tenants LIMIT 1;

-- Then create Event 20 (replace 'YOUR_TENANT_ID' with actual tenant ID)
INSERT INTO events (
    id, 
    name, 
    slug, 
    description, 
    tenant_id, 
    venue, 
    capacity, 
    status, 
    visibility, 
    starts_at, 
    ends_at, 
    timezone, 
    currency,
    created_at,
    updated_at
) VALUES (
    20,
    'Test Event 20',
    'test-event-20',
    'Test event for production testing',
    'YOUR_TENANT_ID',
    'Test Venue',
    100,
    'PUBLISHED',
    'PUBLIC',
    '2025-12-31 18:00:00',
    '2025-12-31 23:00:00',
    'Asia/Kolkata',
    'INR',
    NOW(),
    NOW()
);
```

### B. Via Vercel CLI

If you have Vercel CLI installed:

```bash
# Set production DATABASE_URL
export DATABASE_URL="your_production_database_url"

# Run the creation script
cd apps/web
npx tsx create-event-20-production.ts
```

---

## Option 3: Use Existing Event (RECOMMENDED)

**The simplest solution:**

1. Go to https://aypheneventplanner.vercel.app/events
2. Check what events already exist
3. Use one of those event IDs for testing
4. No need to create Event 20 specifically!

For example, if Event 5 exists:
- Test registrations at: `/events/5/register`
- Test floor plan at: `/events/5/design/floor-plan`
- View registrations at: `/events/5/registrations`

---

## After Event is Created

Once Event 20 (or any event) exists in production:

### Test Registrations:
1. Go to: `https://aypheneventplanner.vercel.app/events/20/register`
2. Fill out the registration form
3. Submit
4. ✅ Registration will be saved to production database
5. ✅ It will appear in the registration list
6. ✅ Stats will update (Total, Approved, etc.)

### Test Floor Plan:
1. Go to: `https://aypheneventplanner.vercel.app/events/20/design/floor-plan`
2. Create or edit floor plan
3. Save
4. ✅ Floor plan will be saved to production database

### Test Communication:
1. Go to: `https://aypheneventplanner.vercel.app/events/20/communicate`
2. Click SMS or WhatsApp tab
3. ✅ Phone numbers from registrations will load automatically

---

## How to Get Production Database URL

If you need to access the production database directly:

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard

2. **Select your project:**
   - Click on "aypheneventplanner"

3. **Go to Settings:**
   - Click "Settings" tab
   - Click "Environment Variables"

4. **Find DATABASE_URL:**
   - Look for `DATABASE_URL` variable
   - Click "Show" to reveal the value
   - This is your production database connection string

---

## Recommended Action

**Just create a new event via the UI:**

1. Go to https://aypheneventplanner.vercel.app
2. Login
3. Create a new event
4. Use that event's ID for all testing
5. Everything will work! ✅

**No need to worry about Event 20 specifically** - any event ID will work as long as it exists in the production database!

---

## Summary

The issue is NOT with your code - **all fixes are deployed and working!**

The issue is simply that **Event 20 doesn't exist in production database**.

**Quick Fix:** Create any event in production UI and use its ID for testing. Done! 🎉
