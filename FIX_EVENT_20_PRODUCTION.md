# FIX: Create Event 20 in Production Database

## Quick Instructions

### Step 1: Get Your Production Database URL

1. Go to **https://vercel.com/dashboard**
2. Click on your project: **aypheneventplanner**
3. Go to **Settings** → **Environment Variables**
4. Find **DATABASE_URL** and click **"Show"** to reveal the value
5. **Copy the entire URL** (it will look like: `postgresql://user:pass@host:5432/database`)

### Step 2: Run the Script

Open your terminal and run:

```bash
cd "/Users/rajasekar/Event Planner V1/apps/web"

PROD_DB="paste_your_production_database_url_here" npx tsx create-event-20-production-direct.ts
```

**Replace `paste_your_production_database_url_here` with the actual URL you copied from Vercel!**

### Example:

```bash
PROD_DB="postgresql://user:password@host.region.provider.com:5432/verceldb" npx tsx create-event-20-production-direct.ts
```

### Step 3: Verify

After the script runs successfully, you'll see:

```
✅ SUCCESS! Event 20 created in PRODUCTION!
```

Then test in production:
- Go to: https://aypheneventplanner.vercel.app/events/20/register
- Create a registration
- Check: https://aypheneventplanner.vercel.app/events/20/registrations
- ✅ Registration will appear!

---

## Alternative: Create Event via UI (No Database Access Needed)

If you don't want to deal with database URLs:

1. Go to **https://aypheneventplanner.vercel.app**
2. Login
3. Go to **Events** → **Create New Event**
4. Fill in the form and save
5. Note the event ID from the URL
6. Use that event ID for testing (doesn't have to be 20!)

---

## Troubleshooting

### "No database URL provided"
- Make sure you're using `PROD_DB=` before the command
- Make sure the URL is in quotes
- Make sure there are no spaces around the `=`

### "Connection error"
- Verify the DATABASE_URL is correct
- Check it's the production URL from Vercel, not local
- Make sure you copied the entire URL including `postgresql://`

### "Event 20 already exists"
- Great! That means it's already there
- You can start testing immediately

---

## What Happens After Event 20 is Created

✅ **Registrations will work** - Save to production DB  
✅ **Floor plan will work** - Save to production DB  
✅ **Registration list will show data** - Real-time stats  
✅ **Communication tab will work** - Phone numbers load  
✅ **QR codes will generate** - Properly displayed  
✅ **Everything works in production!** 🎉

---

## Need Help?

If you get stuck, just:
1. Create a new event via the UI (easiest option)
2. Use that event's ID for testing
3. No database access needed!
