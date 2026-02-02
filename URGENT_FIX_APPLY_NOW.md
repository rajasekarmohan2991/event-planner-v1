# 🚨 URGENT FIX - Apply This SQL Now

## The error is still happening because the database hasn't been updated yet.

### **STEP 1: Go to Supabase Dashboard**
1. Open https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar

### **STEP 2: Copy and Paste This SQL**

```sql
-- Fix text field lengths for AI-generated content
-- Run this in Supabase SQL Editor

ALTER TABLE "events" ALTER COLUMN "description" TYPE TEXT;
ALTER TABLE "events" ALTER COLUMN "terms_and_conditions" TYPE TEXT;
ALTER TABLE "events" ALTER COLUMN "disclaimer" TYPE TEXT;
ALTER TABLE "speakers" ALTER COLUMN "bio" TYPE TEXT;

-- Verify the changes
SELECT 
    column_name, 
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('description', 'terms_and_conditions', 'disclaimer')
ORDER BY column_name;
```

### **STEP 3: Click "Run" (or press Ctrl+Enter)**

You should see:
```
Success. No rows returned
```

Then the verification query will show:
```
column_name          | data_type | character_maximum_length
---------------------|-----------|-------------------------
description          | text      | null
disclaimer           | text      | null
terms_and_conditions | text      | null
```

### **STEP 4: Test Event Creation**
1. Go to your app: https://aypheneventplanner.vercel.app/events/new
2. Fill in event details
3. Click "✨ Generate AI Overview"
4. Submit the form
5. Should work! ✅

---

## Alternative: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migration
supabase db execute --file apps/web/prisma/migrations/fix_text_fields.sql
```

---

## Why This Is Needed

- ✅ Code is updated (schema.prisma)
- ✅ Code is deployed (Vercel)
- ❌ **Database is NOT updated** ← This is the problem!

The database still has VARCHAR(255) columns, which can't store the long AI-generated text.

---

## After Applying

Once you run the SQL:
1. Event creation will work immediately
2. AI-generated descriptions will save successfully
3. No more 500 errors

---

**DO THIS NOW:** Go to Supabase SQL Editor and run the SQL above! 👆
