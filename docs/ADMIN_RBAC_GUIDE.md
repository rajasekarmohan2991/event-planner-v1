# 🔐 Admin Settings & RBAC Guide

## ✅ Portal Members Section Removed
The "Portal Members" section has been completely removed from the Team page as requested.

---

## 🎯 Admin Settings Location

### 1. **Admin Dashboard**
**URL**: http://localhost:3001/admin

**Access**: Only SUPER_ADMIN role can access

**Features**:
- User management
- System-wide settings
- Verification management

### 2. **User Management**
**URL**: http://localhost:3001/admin/users

**What you can do**:
- View all users in the system
- See user roles (SUPER_ADMIN, ADMIN, EVENT_MANAGER, USER)
- View user creation dates
- Manage user accounts

### 3. **Event Team Management** (Per Event)
**URL**: http://localhost:3001/events/{eventId}/team

**What you can do**:
- Invite team members to specific events
- Assign roles: Event Staff, Event Owner, Coordinator, Vendor
- Approve/reject team member requests
- Change member roles
- Remove team members

---

## 🔑 Current User Roles & Hierarchy

### System-Wide Roles (in database `User` table)

1. **SUPER_ADMIN** (You!)
   - Full system access
   - Can see ALL tenants' data
   - Can access admin dashboard
   - Can manage all users
   - Can create/edit/delete any event

2. **ADMIN**
   - Can access admin dashboard
   - Can manage users within their tenant
   - Can manage events within their tenant

3. **EVENT_MANAGER**
   - Can create and manage events
   - Can invite team members
   - Limited to their tenant

4. **USER**
   - Basic user access
   - Can register for events
   - Can view events

### Event-Specific Roles (in `EventTeamMember` table)

1. **Event Owner**
   - Full control over the event
   - Can manage all event settings
   - Can invite/remove team members

2. **Coordinator**
   - Can manage event details
   - Can manage registrations
   - Can view reports

3. **Event Staff**
   - Can check-in attendees
   - Can view event details
   - Limited editing rights

4. **Vendor**
   - Can manage their booth/services
   - Can view relevant event info
   - No editing rights

---

## 🏢 Tenant System Explained

### What is a Tenant?
A tenant is an isolated workspace/organization. Each tenant has:
- Its own events
- Its own users (via `TenantMember` table)
- Its own data isolation

### Current Tenants in Database
```sql
-- Check tenants
SELECT DISTINCT tenant_id FROM events;
```

**Result**: `default-tenant`

### How Tenants Work

1. **Regular Users**: See only their tenant's data
2. **SUPER_ADMIN** (You): See ALL tenants' data

### Tenant Headers
The system uses HTTP headers to identify tenants:
- `x-tenant-id`: Identifies which tenant's data to access
- `x-user-role`: Identifies user's system role

---

## 🧪 How to Test RBAC

### Test 1: SUPER_ADMIN Access (You)

**Current User**: rbusiness2111@gmail.com  
**Role**: SUPER_ADMIN  
**Tenant**: default-tenant

**What you can do**:
```bash
# 1. Access admin dashboard
http://localhost:3001/admin

# 2. View all users
http://localhost:3001/admin/users

# 3. See ALL events (across all tenants)
http://localhost:3001/events

# 4. Manage any event
http://localhost:3001/events/1/team
```

---

### Test 2: Create a Regular User

**Step 1: Create User in Database**
```sql
-- Connect to database
docker compose exec postgres psql -U postgres -d event_planner

-- Create a regular user
INSERT INTO "User" (email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'testuser@example.com',
  'Test User',
  '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52', -- password: password123
  'USER',
  NOW(),
  NOW(),
  NOW()
);
```

**Step 2: Login as Test User**
1. Logout from current session
2. Go to http://localhost:3001/auth/signin
3. Login with: `testuser@example.com` / `password123`

**Step 3: Verify Limited Access**
- ❌ Cannot access http://localhost:3001/admin (Forbidden)
- ✅ Can view events
- ❌ Cannot create events (unless EVENT_MANAGER role)

---

### Test 3: Create an EVENT_MANAGER

```sql
-- Create event manager
INSERT INTO "User" (email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'manager@example.com',
  'Event Manager',
  '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52',
  'EVENT_MANAGER',
  NOW(),
  NOW(),
  NOW()
);
```

**What EVENT_MANAGER can do**:
- ✅ Create events
- ✅ Manage their events
- ✅ Invite team members
- ❌ Cannot access admin dashboard
- ❌ Cannot see other managers' events (unless same tenant)

---

### Test 4: Multi-Tenant Testing

**Step 1: Create Second Tenant**
```sql
-- Create event with different tenant
INSERT INTO events (
  name, city, tenant_id, status, event_mode, 
  starts_at, ends_at, expected_attendees, created_at, updated_at
)
VALUES (
  'Tenant 2 Event',
  'Mumbai',
  'tenant-2',
  'DRAFT',
  'IN_PERSON',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '8 days',
  100,
  NOW(),
  NOW()
);
```

**Step 2: Test Tenant Isolation**

**As SUPER_ADMIN**:
- ✅ Can see events from `default-tenant`
- ✅ Can see events from `tenant-2`
- ✅ Can see ALL events

**As Regular User** (with tenant-2):
- ✅ Can see events from `tenant-2`
- ❌ Cannot see events from `default-tenant`

---

## 🔧 How to Change User Roles

### Method 1: Direct Database Update
```sql
-- Connect to database
docker compose exec postgres psql -U postgres -d event_planner

-- View current users
SELECT id, email, role FROM "User";

-- Change role to ADMIN
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'testuser@example.com';

-- Change role to EVENT_MANAGER
UPDATE "User" 
SET role = 'EVENT_MANAGER' 
WHERE email = 'manager@example.com';

-- Change role to SUPER_ADMIN
UPDATE "User" 
SET role = 'SUPER_ADMIN' 
WHERE email = 'newadmin@example.com';
```

### Method 2: Via Admin UI (Coming Soon)
The admin dashboard at `/admin/users` currently shows users but doesn't have role editing UI yet.

**To add role editing**:
1. Add "Edit" button to user table
2. Create modal with role dropdown
3. Call API to update user role
4. Refresh user list

---

## 📊 Database Schema for RBAC

### User Table
```sql
-- View user structure
\d "User"

-- Key columns:
-- id: User ID
-- email: Login email
-- role: SUPER_ADMIN | ADMIN | EVENT_MANAGER | USER
-- createdAt: When user was created
```

### TenantMember Table
```sql
-- View tenant membership
\d "TenantMember"

-- Links users to tenants
-- userId: References User.id
-- tenantId: Which tenant they belong to
-- role: Their role within that tenant
```

### EventTeamMember Table
```sql
-- View event team structure
\d event_team_members

-- Links users to specific events
-- event_id: Which event
-- email: Team member email
-- role: Event Staff | Event Owner | Coordinator | Vendor
-- status: INVITED | JOINED | REJECTED
```

---

## 🎯 Quick Commands

### View All Users and Roles
```sql
docker compose exec postgres psql -U postgres -d event_planner -c "SELECT id, email, name, role FROM \"User\";"
```

### View Events by Tenant
```sql
docker compose exec postgres psql -U postgres -d event_planner -c "SELECT id, name, tenant_id FROM events;"
```

### View Event Team Members
```sql
docker compose exec postgres psql -U postgres -d event_planner -c "SELECT event_id, email, role, status FROM event_team_members;"
```

### Change User Role
```sql
docker compose exec postgres psql -U postgres -d event_planner -c "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'user@example.com';"
```

---

## 🚀 Testing Checklist

### As SUPER_ADMIN (rbusiness2111@gmail.com)
- [x] Access admin dashboard: http://localhost:3001/admin
- [x] View all users: http://localhost:3001/admin/users
- [x] See all events (all tenants)
- [x] Create events
- [x] Manage any event's team

### As ADMIN
- [ ] Access admin dashboard
- [ ] View users in their tenant
- [ ] Manage events in their tenant
- [ ] Cannot see other tenants' data

### As EVENT_MANAGER
- [ ] Create events
- [ ] Manage their events
- [ ] Invite team members
- [ ] Cannot access admin dashboard

### As USER
- [ ] View events
- [ ] Register for events
- [ ] Cannot create events
- [ ] Cannot access admin dashboard

---

## 📝 Summary

**Admin Settings Location**: http://localhost:3001/admin (SUPER_ADMIN only)

**User Management**: http://localhost:3001/admin/users

**Your Current Role**: SUPER_ADMIN (full access)

**Tenant**: default-tenant

**How to Test**:
1. Create test users with different roles (SQL above)
2. Login as each user
3. Verify access restrictions
4. Test multi-tenant isolation

**Portal Members**: ✅ Removed from Team page

**Next Steps**:
1. Test SUPER_ADMIN access at /admin
2. Create test users with different roles
3. Verify RBAC works correctly
4. Test tenant isolation with multiple tenants
