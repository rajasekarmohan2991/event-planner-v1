# ✅ Next Steps - After Updating .env to Supabase

## What You Just Did

✅ Updated your local `.env` file to point to Supabase  
✅ Now local development will use the same database as production

## Next Steps

### 1. Verify the Connection

Run this command to check if you're connected to Supabase:

```bash
cd "/Users/rajasekar/Event Planner V1/apps/web"
npx tsx check-supabase.ts
```

This will:
- ✅ Test connection to Supabase
- ✅ Check if Event 20 exists
- ✅ Create Event 20 if it doesn't exist
- ✅ Show all events in Supabase
- ✅ Count registrations for Event 20

### 2. Start Development Server

```bash
cd "/Users/rajasekar/Event Planner V1/apps/web"
npm run dev
```

### 3. Test Registration

1. Open http://localhost:3001
2. Go to Event 20: http://localhost:3001/events/20/register
3. Fill out the registration form
4. Submit

### 4. Verify It Worked

Check if the registration appears:
- **Local:** http://localhost:3001/events/20/registrations
- **Production:** https://aypheneventplanner.vercel.app/events/20/registrations

✅ **It should appear in BOTH places** because they use the same Supabase database!

---

## Troubleshooting

### If check-supabase.ts hangs or fails:

**Check your DATABASE_URL format:**

It should look like:
```
DATABASE_URL="postgresql://postgres.xxxxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres"
```

**Common issues:**
- ❌ Missing password in the URL
- ❌ Wrong format (should start with `postgresql://`)
- ❌ Still pointing to `localhost:5432`

**To fix:**
1. Go to https://app.supabase.com
2. Select your project → Settings → Database
3. Copy the **Connection String** (URI format)
4. Replace `[YOUR-PASSWORD]` with your actual password
5. Update `.env` file
6. Try again

### If Event 20 doesn't exist:

The script will automatically create it! Just run:
```bash
cd apps/web && npx tsx check-supabase.ts
```

### If registrations still don't appear:

1. **Hard refresh** browser (`Cmd+Shift+R`)
2. **Check browser console** for errors
3. **Check Network tab** - look at the API response
4. **Verify DATABASE_URL** is correct in `.env`

---

## What Should Happen Now

After everything is set up:

✅ **Local testing → Saves to Supabase**  
✅ **Production → Saves to Supabase**  
✅ **Same data everywhere**  
✅ **Event 20 exists in Supabase**  
✅ **Registrations appear in both local and production**  
✅ **Stats update in real-time**  
✅ **Floor plan works**  
✅ **Communication tab loads phone numbers**  

---

## Quick Test Checklist

- [ ] Run `npx tsx check-supabase.ts` - Should connect successfully
- [ ] Event 20 exists in Supabase
- [ ] Start dev server: `npm run dev`
- [ ] Create a registration locally
- [ ] Registration appears in local list
- [ ] Registration appears in production list
- [ ] Stats update (Total, Approved, etc.)

---

## Summary

**Before:**
- Local → Local PostgreSQL
- Production → Supabase
- ❌ Different databases, different data

**After:**
- Local → Supabase ✅
- Production → Supabase ✅
- ✅ Same database, same data everywhere!

Just run the check script and start your dev server to test! 🚀
