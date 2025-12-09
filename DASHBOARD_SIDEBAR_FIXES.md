# Dashboard & Sidebar Fixes

## Issues Fixed

### 1. ✅ Removed Duplicate Create Event Card
**Issue:** Two "Create Event" cards showing on Event Manager dashboard
**Solution:** Replaced the duplicate in Quick Actions section with "Ticket Sales" card

**File:** `/apps/web/app/dashboard/event-manager/page.tsx`

**Before:**
- Header: Create Event button
- Quick Actions: Create Event card (duplicate)

**After:**
- Header: Create Event button (kept)
- Quick Actions: Ticket Sales card (replaced)

### 2. ✅ Hidden Users Menu from Event Manager
**Issue:** Event Managers could see Users menu item in sidebar
**Solution:** Restricted Users menu to SUPER_ADMIN, ADMIN, and TENANT_ADMIN only

**File:** `/apps/web/components/admin/AdminSidebar.tsx`

**Changes:**
```typescript
// Before: Users shown to everyone
const baseNavigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Users', href: '/admin/users', icon: Users },
]

// After: Users only for admins
const baseNavigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Events', href: '/admin/events', icon: Calendar },
]

// Add Users only for SUPER_ADMIN and ADMIN (not EVENT_MANAGER)
if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'TENANT_ADMIN') {
  baseNavigation.push({ name: 'Users', href: '/admin/users', icon: Users })
}
```

## Dashboard Quick Actions

### Event Manager Dashboard
**Location:** http://localhost:3001/dashboard/event-manager

**Quick Actions Cards:**
1. **Manage Events** - View and edit all events
2. **Promo Codes** - Create and manage discounts
3. **Ticket Sales** - View registrations and sales (NEW)

## Sidebar Menu Visibility

### Event Manager Role
**Can See:**
- Dashboard
- Events
- Settings

**Cannot See:**
- Users (Admin only)
- Lookup Data (Super Admin only)
- System Settings (Super Admin only)

### Admin/Tenant Admin Role
**Can See:**
- Dashboard
- Events
- Users
- Settings

### Super Admin Role
**Can See:**
- Dashboard
- Events
- Users
- Lookup Data
- System Settings
- Settings

## Files Modified

1. **`/apps/web/app/dashboard/event-manager/page.tsx`**
   - Replaced Create Event card with Ticket Sales card
   - Links to `/registrations` page

2. **`/apps/web/components/admin/AdminSidebar.tsx`**
   - Added role-based filtering for Users menu item
   - Only SUPER_ADMIN, ADMIN, TENANT_ADMIN can see Users

## Testing

### Test Event Manager View
1. Login as Event Manager
2. Go to Dashboard
3. ✅ Should see only ONE Create Event button (in header)
4. ✅ Should see Ticket Sales card in Quick Actions
5. ✅ Should NOT see Users in sidebar

### Test Admin View
1. Login as Admin or Super Admin
2. Go to Dashboard
3. ✅ Should see Users in sidebar
4. ✅ Should have access to user management

## Build Status

```
✅ Web service restarted
✅ Changes applied
✅ No errors in logs
✅ All services running
```

## Summary

**✅ Removed duplicate Create Event card**  
**✅ Added Ticket Sales card to dashboard**  
**✅ Hidden Users menu from Event Managers**  
**✅ Users menu visible only to admins**  
**✅ Build successful**

Event Managers now have a cleaner dashboard with proper access controls!
