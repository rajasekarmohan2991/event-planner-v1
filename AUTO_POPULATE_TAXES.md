# Auto-Populate Default Tax Structures

## Feature Overview

Automatically populate default tax structures for companies based on their country. This eliminates the need for manual tax configuration and ensures companies start with appropriate tax rates.

## How It Works

### 1. Default Tax Configurations by Country

The system includes pre-configured tax structures for major countries:

| Country | Default Taxes |
|---------|---------------|
| 🇮🇳 India | GST 18% (default), GST 12%, GST 5% |
| 🇺🇸 USA | Sales Tax 7.5% (default), Sales Tax 5% |
| 🇬🇧 UK | VAT 20% (default), VAT 5%, VAT 0% |
| 🇨🇦 Canada | HST 13% (default), GST 5% |
| 🇦🇺 Australia | GST 10% (default) |
| 🇩🇪 Germany | VAT 19% (default), VAT 7% |
| 🇫🇷 France | VAT 20% (default), VAT 10% |
| 🇸🇬 Singapore | GST 8% (default) |
| 🇦🇪 UAE | VAT 5% (default) |
| 🌍 Other | Standard Tax 10% (default) |

### 2. API Endpoint

**POST** `/api/company/tax-structures/auto-populate`

**Authentication**: Required (company user)

**Response**:
```json
{
  "message": "Successfully created 3 default tax structures",
  "taxes": [
    {
      "id": "tax_1234567890_abc123",
      "name": "GST 18%",
      "rate": 18.0,
      "description": "Standard GST rate for goods and services",
      "isDefault": true
    },
    ...
  ],
  "country": "IN"
}
```

### 3. Usage

#### Option A: Manual Trigger (Browser Console)

After Vercel deploys, run this in the browser console while logged in:

```javascript
fetch('/api/company/tax-structures/auto-populate', {
  method: 'POST'
})
.then(r => r.json())
.then(data => {
  console.log('Auto-populated taxes:', data);
  // Refresh the page to see the new taxes
  window.location.reload();
});
```

#### Option B: Add Button to UI (Future Enhancement)

Add a button in the empty state of the tax settings page:

```tsx
<button onClick={handleAutoPopulate}>
  Auto-Populate Default Taxes
</button>
```

## Implementation Details

### Files Created

1. **`/apps/web/lib/default-taxes.ts`**
   - Contains default tax configurations for each country
   - Utility functions to get taxes by country code

2. **`/apps/web/app/api/company/tax-structures/auto-populate/route.ts`**
   - API endpoint to trigger auto-population
   - Checks for existing taxes to avoid duplicates
   - Creates taxes based on company's country

### Features

✅ **Country-Specific**: Automatically detects company country and applies appropriate taxes
✅ **Duplicate Prevention**: Skips taxes that already exist
✅ **Default Tax**: Marks one tax as default for automatic application
✅ **Customizable**: Companies can edit or delete auto-populated taxes
✅ **Safe**: Uses raw SQL for reliability

## Testing

### 1. Test Auto-Population

After deployment, login as a company and run:

```javascript
// Check current taxes
fetch('/api/company/tax-structures').then(r => r.json()).then(console.log);

// Auto-populate
fetch('/api/company/tax-structures/auto-populate', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);

// Check again
fetch('/api/company/tax-structures').then(r => r.json()).then(console.log);
```

### 2. Verify in UI

1. Navigate to `/admin/settings/tax`
2. Should see the auto-populated taxes
3. One should be marked as "Default"

## Future Enhancements

### Phase 1: UI Button (Recommended)
Add "Auto-Populate Default Taxes" button in the empty state

### Phase 2: Automatic on First Login
Auto-populate when company first accesses tax settings

### Phase 3: Smart Detection
- Detect company location from IP
- Suggest appropriate taxes even if country not set

### Phase 4: Tax Rate Updates
- Notify when tax rates change in their country
- Option to update to new rates

## Deployment Status

| Commit | Description | Status |
|--------|-------------|--------|
| `513faad` | Add default taxes utility | ✅ Pushed |
| `18e0612` | Add auto-populate API endpoint | ✅ Pushed |

## Next Steps

1. ✅ **Code Complete** - All files created and pushed
2. ⏳ **Vercel Deploy** - Waiting for deployment
3. 🧪 **Test** - Run manual test after deployment
4. 🎨 **UI Enhancement** - Add button to tax settings page (optional)

---

**Status**: Ready for production testing
**ETA**: Available after next Vercel deployment (~3-5 minutes)
