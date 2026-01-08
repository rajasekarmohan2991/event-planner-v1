# 🔧 Fix for Supabase Timeout Error

## The timeout happened because we tried to alter multiple columns at once.

## ✅ Solution: Run One Command at a Time

### **STEP 1: Set Longer Timeout**

Run this FIRST in Supabase SQL Editor:

```sql
-- Increase statement timeout to 5 minutes
SET statement_timeout = '300s';
```

Click "Run" ✅

---

### **STEP 2: Alter Columns One by One**

Now run each of these **separately** (one at a time):

#### **Command 1: Fix Event Description**
```sql
ALTER TABLE "events" ALTER COLUMN "description" TYPE TEXT;
```
Click "Run" → Wait for success ✅

#### **Command 2: Fix Terms and Conditions**
```sql
ALTER TABLE "events" ALTER COLUMN "terms_and_conditions" TYPE TEXT;
```
Click "Run" → Wait for success ✅

#### **Command 3: Fix Disclaimer**
```sql
ALTER TABLE "events" ALTER COLUMN "disclaimer" TYPE TEXT;
```
Click "Run" → Wait for success ✅

#### **Command 4: Fix Speaker Bio**
```sql
ALTER TABLE "speakers" ALTER COLUMN "bio" TYPE TEXT;
```
Click "Run" → Wait for success ✅

---

### **STEP 3: Verify**

```sql
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name = 'description';
```

Should show: `text` ✅

---

## Alternative: Direct Database Connection

If Supabase SQL Editor keeps timing out, connect directly:

### **Using psql:**

```bash
# Get your direct connection string from Supabase
# Settings → Database → Connection String → Direct connection

# Then run:
psql "postgresql://postgres:[password]@db.zaglxgicnpnlquxxqvqu.supabase.co:5432/postgres" << 'EOF'
SET statement_timeout = '300s';
ALTER TABLE "events" ALTER COLUMN "description" TYPE TEXT;
ALTER TABLE "events" ALTER COLUMN "terms_and_conditions" TYPE TEXT;
ALTER TABLE "events" ALTER COLUMN "disclaimer" TYPE TEXT;
ALTER TABLE "speakers" ALTER COLUMN "bio" TYPE TEXT;
EOF
```

### **Using Supabase CLI:**

```bash
# Install if needed
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref zaglxgicnpnlquxxqvqu

# Run migration
cat > /tmp/fix.sql << 'EOF'
SET statement_timeout = '300s';
ALTER TABLE "events" ALTER COLUMN "description" TYPE TEXT;
ALTER TABLE "events" ALTER COLUMN "terms_and_conditions" TYPE TEXT;
ALTER TABLE "events" ALTER COLUMN "disclaimer" TYPE TEXT;
ALTER TABLE "speakers" ALTER COLUMN "bio" TYPE TEXT;
EOF

supabase db execute --file /tmp/fix.sql
```

---

## Why Timeout Happens

1. **Large table** - Many rows in events table
2. **Table locks** - PostgreSQL locks table during ALTER
3. **Concurrent queries** - Other queries running
4. **Supabase limits** - Free tier has query timeouts

---

## Quick Fix: Minimal Change

If all else fails, just fix the description field (most important):

```sql
SET statement_timeout = '300s';
ALTER TABLE "events" ALTER COLUMN "description" TYPE TEXT;
```

This will fix the immediate AI-generated content issue.

---

## After Success

Test event creation:
1. Go to `/events/new`
2. Generate AI content
3. Submit form
4. Should work! ✅

---

**TRY THIS:** Run commands one at a time with timeout set first! 👆
