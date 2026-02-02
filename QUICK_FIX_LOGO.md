# ⚡ QUICK FIX: Add Logo Column

## 🎯 What You Need to Do

**Copy this SQL and run it in Supabase:**

```sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo TEXT;
```

## 📍 Where to Run It

### Supabase Dashboard (EASIEST):

1. Open: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" (left sidebar)
4. Click "New Query"
5. Paste the SQL above
6. Click "Run" (or Cmd+Enter)

### Expected Result:
```
Success. No rows returned
```

## ✅ That's It!

After running this:
- Logo upload will work immediately
- No restart needed
- Test by uploading a logo in Settings

## 🧪 Test Logo Upload

1. Login as a company (e.g., MS Event Management)
2. Go to **Settings**
3. Find **"Company Logo"** card
4. Click **"Upload Logo"**
5. Select an image
6. Should upload successfully! ✅

---

**Note**: I cannot run this for you because I don't have direct access to your Supabase database. You need to run it manually in the Supabase Dashboard.
