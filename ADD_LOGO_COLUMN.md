# Add Logo Column to Database

## Quick Start

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste this SQL:

```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo TEXT;
```

6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see: "Success. No rows returned"

### Option 2: Using Command Line

If you have `psql` installed and `DATABASE_URL` set:

```bash
cd /Users/rajasekar/Event\ Planner\ V1
./scripts/add-logo-column.sh
```

### Option 3: Manual SQL File

Run the migration file directly:

```bash
psql "$DATABASE_URL" -f prisma/migrations/add_logo_column.sql
```

## What This Does

- Adds a `logo` column to the `tenants` table
- Type: `TEXT` (stores URL to logo image)
- Allows `NULL` values (optional logo)
- Creates an index for faster queries
- Adds documentation comment

## Verification

After running the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' AND column_name = 'logo';
```

Expected result:
```
column_name | data_type
------------+----------
logo        | text
```

## Testing Logo Upload

1. **Login** as a company (not super admin)
2. **Navigate** to Settings
3. **Find** the "Company Logo" card
4. **Click** "Upload Logo"
5. **Select** an image file (JPG, PNG, SVG, GIF)
6. **Wait** for upload to complete
7. **Verify** logo appears in the preview

## Troubleshooting

### Error: "column 'logo' already exists"
✅ This is fine! The column is already there. No action needed.

### Error: "Failed to update company logo"
Check:
1. Is the `logo` column added? Run verification SQL above
2. Is Vercel Blob configured? Check `BLOB_READ_WRITE_TOKEN` env var
3. Check Vercel Runtime Logs for detailed error

### Upload hangs on "Uploading..."
Check:
1. File size < 5MB?
2. Valid image format (JPG, PNG, SVG, GIF)?
3. Check browser console for errors (F12)
4. Check Vercel Runtime Logs

## Files Created

- `prisma/migrations/add_logo_column.sql` - SQL migration file
- `scripts/add-logo-column.sh` - Bash script to run migration
- `ADD_LOGO_COLUMN.md` - This documentation

## Next Steps

After adding the column:

1. ✅ Run the migration (choose one option above)
2. ✅ Verify column exists
3. ✅ Test logo upload
4. ✅ Configure Vercel Blob (if not done)

## Vercel Blob Setup (If Needed)

If you haven't set up Vercel Blob storage:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database** → **Blob**
5. Vercel auto-configures `BLOB_READ_WRITE_TOKEN`
6. Redeploy your app

---

**Status**: Migration ready to run
**Impact**: Low (adds optional column, no data changes)
**Rollback**: `ALTER TABLE tenants DROP COLUMN logo;` (if needed)
