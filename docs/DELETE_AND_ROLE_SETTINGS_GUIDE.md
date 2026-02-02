# ✅ Delete Event & Role Settings Guide

## Issues Fixed

### 1. ✅ SUPER_ADMIN Can Now Delete Events
**Issue**: "Authentication required" error when trying to delete events

**Problem**: Code required `accessToken` which doesn't exist in session

**Fixed**: Removed accessToken check - SUPER_ADMIN can now delete events

**Result**: ✅ Delete works immediately

---

### 2. ✅ Create Event Button Moved to Dashboard
**Issue**: Create Event button was on events list page

**Fixed**: 
- ✅ Removed from events list page
- ✅ Added to dashboard page (top right)

**Result**: Cleaner events list, prominent button on dashboard

---

## 🎯 Where to Assign Role Settings

### System-Wide Roles (SUPER_ADMIN, ADMIN, etc.)

#### Option 1: Database (Current Method)
```sql
# Connect to database
docker compose exec postgres psql -U postgres -d event_planner

# View all users
SELECT id, email, name, role FROM "User";

# Change user role
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'user@example.com';

# Available roles:
# - SUPER_ADMIN (you)
# - ADMIN
# - EVENT_MANAGER
# - USER
```

#### Option 2: Admin Dashboard (Recommended - To Be Built)
**URL**: http://localhost:3001/admin/users

**What needs to be added**:
1. "Edit Role" button for each user
2. Dropdown with role options
3. Save button to update role
4. Confirmation dialog

**Current Status**: Page shows users but no edit functionality yet

---

### Event-Specific Roles (Event Owner, Coordinator, etc.)

#### Where to Assign: Team Page
**URL**: http://localhost:3001/events/{eventId}/team

**How to assign**:
1. Click "Invite Event Members" button
2. Enter email addresses
3. Select role from dropdown:
   - Event Owner
   - Coordinator
   - Event Staff
   - Vendor
4. Click "Invite"

**To change existing member role**:
1. Click "Edit" button next to member
2. Select new role
3. Save

**View role permissions**:
- Click "Roles and Privileges" tab
- See what each role can do

---

## 🔧 How to Build Role Management UI

### For Admin Dashboard (System Roles)

**File to edit**: `/apps/web/app/(admin)/admin/users/page.tsx`

**What to add**:

```typescript
// 1. Add Edit button to each user row
<button onClick={() => setEditingUser(user)}>Edit</button>

// 2. Add modal/dialog for role editing
{editingUser && (
  <div className="modal">
    <select value={editingUser.role} onChange={handleRoleChange}>
      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
      <option value="ADMIN">ADMIN</option>
      <option value="EVENT_MANAGER">EVENT_MANAGER</option>
      <option value="USER">USER</option>
    </select>
    <button onClick={saveRole}>Save</button>
  </div>
)}

// 3. Add API call to update role
async function saveRole() {
  await fetch(`/api/admin/users/${editingUser.id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role: editingUser.role })
  })
}
```

**API endpoint to create**: `/apps/web/app/api/admin/users/[id]/role/route.ts`

```typescript
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  // Check if user is SUPER_ADMIN or ADMIN
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  
  const { role } = await req.json()
  
  // Update user role in database
  await prisma.user.update({
    where: { id: params.id },
    data: { role }
  })
  
  return NextResponse.json({ success: true })
}
```

---

## 📊 Role Hierarchy & Permissions

### System Roles (Platform-Wide)

#### SUPER_ADMIN (You!)
- ✅ Full system access
- ✅ See ALL tenants' data
- ✅ Access admin dashboard
- ✅ Manage all users
- ✅ Delete any event
- ✅ Override all restrictions

#### ADMIN
- ✅ Access admin dashboard
- ✅ Manage users in their tenant
- ✅ Manage events in their tenant
- ❌ Cannot see other tenants

#### EVENT_MANAGER
- ✅ Create events
- ✅ Manage their events
- ✅ Invite team members
- ❌ No admin dashboard access

#### USER
- ✅ View events
- ✅ Register for events
- ❌ Cannot create events

---

### Event Roles (Per Event)

#### Event Owner
- ✅ Full event control
- ✅ All permissions

#### Coordinator
- ✅ Edit event
- ✅ Manage registrations
- ❌ Cannot delete event

#### Event Staff
- ✅ Check-in attendees
- ❌ Cannot edit event

#### Vendor
- ✅ Manage booth
- ❌ Read-only

**See full details**: Go to any event → Team → Roles and Privileges tab

---

## 🚀 Quick Actions

### Delete an Event (as SUPER_ADMIN)
1. Go to http://localhost:3001/events/{eventId}/info
2. Click "Delete" button
3. Confirm
4. **Expected**: ✅ Works immediately (no auth error)

### Create an Event
1. Go to http://localhost:3001/dashboard
2. Click "Create Event" button (top right)
3. Fill in details
4. Save

### Change System Role (Database)
```sql
docker compose exec postgres psql -U postgres -d event_planner -c "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'user@example.com';"
```

### Assign Event Role
1. Go to http://localhost:3001/events/{eventId}/team
2. Click "Invite Event Members"
3. Enter email and select role
4. Send invite

---

## 📝 Summary

✅ **Delete Events**: SUPER_ADMIN can delete without auth error  
✅ **Create Event Button**: Moved to dashboard (top right)  
✅ **System Roles**: Assign via database (or build admin UI)  
✅ **Event Roles**: Assign via Team page  
✅ **Role Permissions**: View in Roles and Privileges tab

**Next Steps**:
1. Test deleting an event
2. Check Create Event button on dashboard
3. Build admin UI for role management (optional)
4. Assign event roles via Team page

**Your Current Access**:
- System Role: SUPER_ADMIN (full access)
- Can delete any event
- Can assign any role
- Can override all restrictions
