# Floor Plan Setup Guide

## 🚨 Current Issue

Floor plan API returning **500 error** and floor plan/seat data not saving.

**Error:** `Failed to load resource: the server responded with a status of 500`

---

## 🔍 Root Cause

The `floor_plans` table doesn't exist in your production database (Supabase), causing the API to fail when trying to save floor plan data.

---

## ✅ Solution: Run Database Migration

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

### Step 2: Run Migration Script

Copy and paste the entire contents of `MIGRATION.sql` into the SQL Editor and click **Run**.

The script will:
- ✅ Create `floor_plans` table with all required columns
- ✅ Add indexes for performance
- ✅ Set up foreign key to `events` table
- ✅ Create `updated_at` trigger
- ✅ Verify table structure

### Step 3: Verify Table Created

After running the migration, you should see output showing all columns:

```
table_name   | column_name      | data_type
-------------|------------------|------------------
floor_plans  | id               | text
floor_plans  | eventId          | bigint
floor_plans  | tenant_id        | text
floor_plans  | name             | text
floor_plans  | description      | text
floor_plans  | canvasWidth      | integer
floor_plans  | canvasHeight     | integer
floor_plans  | backgroundColor  | text
floor_plans  | gridSize         | integer
floor_plans  | vipPrice         | numeric
floor_plans  | premiumPrice     | numeric
floor_plans  | generalPrice     | numeric
floor_plans  | totalCapacity    | integer
floor_plans  | vipCapacity      | integer
floor_plans  | premiumCapacity  | integer
floor_plans  | generalCapacity  | integer
floor_plans  | menCapacity      | integer
floor_plans  | womenCapacity    | integer
floor_plans  | layoutData       | jsonb
floor_plans  | status           | text
floor_plans  | version          | integer
floor_plans  | created_at       | timestamp with time zone
floor_plans  | updated_at       | timestamp with time zone
```

---

## 🧪 Testing After Migration

### Step 1: Refresh Your Application
- Go to your event floor plan page
- Refresh the browser (Ctrl+R or Cmd+R)

### Step 2: Try Saving Floor Plan
1. Create or edit a floor plan
2. Add seats/objects to the canvas
3. Click **Save**
4. Should see success message: "Floor plan saved successfully"

### Step 3: Verify Data Saved
1. Refresh the page
2. Floor plan should load with all objects
3. Check browser console - no 500 errors

---

## 📊 What the Floor Plan System Does

### Features:
- **Canvas-based editor** - Drag and drop seats and objects
- **Multiple seat types** - VIP, Premium, General
- **Pricing tiers** - Different prices for different sections
- **Capacity tracking** - Total, VIP, Premium, General
- **Gender segregation** - Men/Women capacity tracking
- **Layout persistence** - All objects saved as JSON
- **Version control** - Track changes to floor plans

### Data Stored:
```json
{
  "id": "clx123abc",
  "eventId": "30",
  "name": "Main Hall Floor Plan",
  "canvasWidth": 1200,
  "canvasHeight": 800,
  "vipPrice": "100.00",
  "premiumPrice": "75.00",
  "generalPrice": "50.00",
  "totalCapacity": 500,
  "layoutData": {
    "objects": [
      {
        "type": "seat",
        "x": 100,
        "y": 100,
        "category": "VIP",
        "seatNumber": "A1"
      }
    ]
  }
}
```

---

## 🔧 Troubleshooting

### Still Getting 500 Error?

**Check 1: Table Exists**
Run in Supabase SQL Editor:
```sql
SELECT * FROM floor_plans LIMIT 1;
```
Should return empty result (not error)

**Check 2: Permissions**
Ensure your database user has permissions:
```sql
GRANT ALL ON floor_plans TO postgres;
```

**Check 3: Vercel Logs**
1. Go to Vercel Dashboard
2. Click your project
3. Go to Deployments → Latest → Functions
4. Look for floor-plan API logs
5. Check for specific error messages

**Check 4: Environment Variables**
Ensure `DATABASE_URL` is set correctly in Vercel:
- Go to Settings → Environment Variables
- Verify `DATABASE_URL` points to Supabase

### Common Errors:

**Error: "relation 'floor_plans' does not exist"**
- Solution: Run the migration script in Supabase

**Error: "column 'layoutData' does not exist"**
- Solution: Re-run migration script (it's safe to run multiple times)

**Error: "permission denied for table floor_plans"**
- Solution: Grant permissions in Supabase SQL Editor

---

## 🎯 Quick Checklist

- [ ] Open Supabase SQL Editor
- [ ] Copy MIGRATION.sql contents
- [ ] Run migration script
- [ ] Verify table created (see column list)
- [ ] Refresh your application
- [ ] Test saving floor plan
- [ ] Verify data persists after page refresh
- [ ] Check no 500 errors in console

---

## 📈 After Migration

Once the table is created:

1. ✅ **Floor plan API will work** - No more 500 errors
2. ✅ **Data will save** - Floor plans persist to database
3. ✅ **Objects will load** - Seats and shapes appear on canvas
4. ✅ **Self-healing active** - Future schema issues auto-fixed

---

## 🆘 Need Help?

If issues persist after migration:

1. **Check Supabase logs** - Database → Logs
2. **Check Vercel logs** - Deployments → Functions
3. **Verify migration ran** - Run verification query
4. **Check browser console** - F12 → Console tab
5. **Test with simple data** - Create minimal floor plan

---

## 📝 Migration Status

**Before Migration:**
- ❌ `floor_plans` table doesn't exist
- ❌ API returns 500 error
- ❌ Floor plan data not saving

**After Migration:**
- ✅ `floor_plans` table created
- ✅ API returns 200/201 success
- ✅ Floor plan data saves correctly
- ✅ Objects persist and load

---

**Run the migration now to fix the floor plan save issue!** 🚀
