# Tax Structure Enhancement Implementation Plan

## Current Issues
1. ❌ Unable to add new tax structures
2. ❌ No effective date/time tracking
3. ❌ No country-specific configuration
4. ❌ No currency conversion support
5. ❌ Missing proper CRUD operations

## Implementation Steps

### Phase 1: Database Schema ✅
- [x] Created migration file: `add_tax_structure_enhancements.sql`
- [x] Added columns: effective_from, effective_to, country_code, currency_code, archived
- [x] Created tax_structure_history table for audit trail
- [x] Added indexes for performance

### Phase 2: Utility Libraries ✅
- [x] Created `lib/country-currency-config.ts` with:
  - Country-currency mappings
  - Exchange rates
  - Currency conversion functions
  - Tax defaults per country

### Phase 3: API Updates (IN PROGRESS)
- [ ] Update GET endpoint to include new fields
- [ ] Update POST endpoint to handle:
  - Effective dates
  - Country selection
  - Currency specification
  - Auto-population based on company currency
- [ ] Update PUT endpoint for editing
- [ ] Update DELETE endpoint for soft delete (archiving)
- [ ] Add validation for overlapping effective dates

### Phase 4: Frontend Updates (TODO)
- [ ] Update tax structure form to include:
  - Effective date picker
  - Country dropdown
  - Currency display
  - Conversion preview
- [ ] Update tax list to show:
  - Effective dates
  - Country flags
  - Currency symbols
  - Active/Archived status
- [ ] Add filtering by:
  - Country
  - Currency
  - Active/Archived
  - Effective date range

### Phase 5: Smart Population Logic (TODO)
- [ ] Implement logic to show relevant taxes based on:
  - Company's base currency
  - Company's country
  - Example: US company sees USD taxes
  - Example: AU company sees both AUD and USD taxes

## Key Features

### 1. Effective Date Management
- Tax structures have `effective_from` and `effective_to` dates
- System automatically uses the correct tax rate based on current date
- Historical rates are preserved for audit purposes

### 2. Country-Specific Configuration
- Each tax linked to a country code (US, AU, IN, etc.)
- Country determines default currency and tax type
- Flag emoji displayed for visual identification

### 3. Currency Conversion
- Tax amounts converted between currencies
- Exchange rates configurable
- Display shows both original and converted amounts

### 4. Smart Population
```
Company Currency: USD, Country: US
→ Shows: US tax structures (USD)

Company Currency: AUD, Country: AU  
→ Shows: AU tax structures (AUD) + US tax structures (USD converted to AUD)
```

### 5. Audit Trail
- All changes tracked in tax_structure_history
- Who changed what and when
- Reason for change

## Files Modified/Created

### Created:
1. `prisma/migrations/add_tax_structure_enhancements.sql`
2. `lib/country-currency-config.ts`

### To Modify:
1. `app/api/super-admin/companies/[id]/tax-structures/route.ts`
2. `app/(admin)/super-admin/companies/[id]/tax-structures/page.tsx`
3. `app/api/company/tax-structures/route.ts` (for individual companies)

## Next Steps
1. Fix the immediate blocker (unable to add tax)
2. Update API to support new fields
3. Update frontend form
4. Test thoroughly
5. Deploy migration on Vercel
