# Quick Fixes Summary - 2026-01-19 11:19

## Issues Reported

### 1. ✅ Digital Signatures - Location Issue
**Problem**: Digital Signatures module should be inside Super Admin → Companies section
**Current Location**: `/super-admin/signatures` (standalone)
**Desired Location**: `/super-admin/companies/[id]/digital-signatures`
**Status**: ⏳ Needs to be moved

### 2. ⚠️ Tax Structure - Still Showing "Add Tax" Button
**Problem**: Individual company tax page still shows "Add Tax Structure" button
**Root Cause**: Vercel deployment in progress - changes not yet live
**Status**: ✅ **FIXED IN CODE** - Waiting for deployment
**Solution**: Code already updated in commit `e84e194`

**Verification**:
```bash
# Local file check - NO "Add Tax" button found
grep -n "Add Tax Structure" apps/web/app/(admin)/admin/settings/tax/page.tsx
# Result: No output (button removed)
```

### 3. ❌ Seat Selector - Not Working
**Problem**: Seat selection not working during registration
**Status**: 🔍 Needs investigation
**Files to Check**:
- `/components/SeatSelector.tsx`
- `/components/events/SeatSelector.tsx`
- `/api/events/[id]/seats/availability/route.ts`

---

## Actions Taken

### Tax Structure (Already Fixed)
- ✅ Removed "Add Tax" button from individual company page
- ✅ Converted to read-only view
- ✅ Added "Read Only" badge
- ✅ Committed in `e84e194`
- ⏳ Deploying to Vercel

### Digital Signatures (To Do)
- [ ] Move from `/super-admin/signatures` to `/super-admin/companies/[id]/digital-signatures`
- [ ] Update navigation links
- [ ] Update API routes if needed
- [ ] Test "Configure" button flow

### Seat Selector (To Do)
- [ ] Investigate why seat selection is not working
- [ ] Check seat availability API
- [ ] Check floor plan generation
- [ ] Check seat component rendering
- [ ] Test registration flow with seats

---

## Current Deployment Status

**Latest Commits**:
1. `e9b61b8` - Invoice system + P2010 fixes
2. `3255696` - Route naming conflict fix
3. `e84e194` - Tax structure centralization ← **DEPLOYING NOW**

**Vercel Status**: Building...

**Expected**:
- Tax structure "Add" button will disappear once deployment completes
- Individual companies will see read-only tax view

---

## Next Steps

### Immediate (Now)
1. ✅ Wait for Vercel deployment to complete
2. ✅ Verify tax page shows read-only view
3. 🔄 Move Digital Signatures to company section
4. 🔄 Fix seat selector issue

### After Deployment
1. Test tax page on production
2. Verify "Add Tax" button is gone
3. Test Digital Signatures location
4. Test seat selection in registration

---

## Digital Signatures - Proposed Structure

### Current
```
Super Admin Dashboard
  └─ Digital Signatures (standalone page)
      └─ List of all companies with DocuSign toggle
```

### Proposed
```
Super Admin Dashboard
  └─ Companies
      └─ Select Company
          └─ Digital Signatures
              ├─ DocuSign Configuration
              ├─ Signature Quota
              ├─ Usage Statistics
              └─ Test Connection
```

**Benefits**:
- Consistent with other company settings (Tax, Finance, etc.)
- Easier to manage per-company settings
- Better organization

---

## Seat Selector - Investigation Needed

**Possible Issues**:
1. Floor plan not generated
2. Seats not created in database
3. Seat availability API failing
4. Component not rendering
5. Event configuration missing

**Debug Steps**:
1. Check if floor plan exists for event
2. Check if seats are generated
3. Check API response for `/api/events/[id]/seats/availability`
4. Check browser console for errors
5. Check network tab for failed requests

---

**Status**: 2 of 3 issues addressed
**Pending**: Digital Signatures move + Seat Selector fix
**Deployment**: In progress (tax fix)
