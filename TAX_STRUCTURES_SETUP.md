# Tax Structures Setup - Quick Fix

## Problem
Tax Settings page shows "No tax structures available"

## Solution
Run the setup API endpoint to create the tax_structures table and populate it with default GST rates.

## Steps to Fix

### Option 1: Using Browser (Easiest)

1. **Open your browser** and go to your deployed app
2. **Login as SUPER_ADMIN**
3. **Open browser console** (F12 → Console tab)
4. **Run this command**:

```javascript
fetch('/api/admin/setup-tax-structures', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log('✅ Setup complete:', data))
.catch(err => console.error('❌ Error:', err))
```

5. **Refresh the Tax Settings page** - You should now see tax structures!

### Option 2: Using curl

```bash
curl -X POST https://your-app-url.vercel.app/api/admin/setup-tax-structures \
  -H "Cookie: your-session-cookie"
```

### Option 3: Using Postman/Insomnia

- Method: POST
- URL: `https://your-app-url.vercel.app/api/admin/setup-tax-structures`
- Auth: Use your session cookie

## What This Creates

For each company, it creates these tax structures:

1. **GST (18%)** - Standard Rate (DEFAULT)
2. **CGST (9%)** - Central GST
3. **SGST (9%)** - State GST
4. **GST (5%)** - Reduced Rate
5. **GST (12%)** - Medium Rate
6. **GST (28%)** - Luxury Rate
7. **No Tax** - Tax Exempt

## Expected Response

```json
{
  "success": true,
  "message": "Tax structures setup complete",
  "stats": {
    "companies": 5,
    "taxStructuresCreated": 35
  }
}
```

## Verification

After running the setup:

1. Go to **Admin → Settings → Tax**
2. You should see all 7 tax structures
3. GST (18%) should be marked as default
4. You can now use these in invoices and registrations

## Troubleshooting

**If you get "Unauthorized":**
- Make sure you're logged in as SUPER_ADMIN
- Check your session is valid

**If table already exists:**
- The script is safe to run multiple times
- It will skip companies that already have tax structures

**If you see errors:**
- Check browser console for details
- Check server logs
- Contact support with the error message

## Database Schema

The tax_structures table has:
- `id` - Unique identifier
- `tenant_id` - Company ID
- `name` - Tax name (e.g., "GST (18%)")
- `rate` - Tax rate as decimal (18.00)
- `description` - Tax description
- `is_default` - Whether this is the default tax
- `is_custom` - Whether custom or from template
- `created_at` / `updated_at` - Timestamps

## Next Steps

After setup:
1. ✅ Tax structures will appear in Tax Settings
2. ✅ Can be used in invoice generation
3. ✅ Can be used in registration pricing
4. ✅ Can be customized per company
5. ✅ Super admin can add more templates

---

**Status**: Ready to run! Just execute the API call and your tax structures will be set up automatically.
