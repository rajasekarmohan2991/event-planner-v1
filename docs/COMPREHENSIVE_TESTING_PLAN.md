# 🧪 Comprehensive Testing Plan - RBAC & CRUD Operations

## Test Environment
- **Browser**: Chromium
- **Base URL**: http://localhost:3001
- **Test User**: rbusiness2111@gmail.com (SUPER_ADMIN)

---

## 📋 Test Categories

### 1. Authentication & Session
### 2. SUPER_ADMIN Role Tests
### 3. ADMIN Role Tests
### 4. EVENT_MANAGER Role Tests
### 5. USER Role Tests
### 6. Event CRUD Operations
### 7. Event Team Management
### 8. Speakers CRUD
### 9. Sponsors CRUD
### 10. Sessions CRUD
### 11. Exhibitors CRUD
### 12. Registrations Management
### 13. Cross-Tenant Access Control

---

## 🔐 1. Authentication & Session Tests

### Test 1.1: Login as SUPER_ADMIN
**Steps**:
1. Go to http://localhost:3001/auth/login
2. Login with: rbusiness2111@gmail.com
3. Check session in browser console: `document.cookie`

**Expected**:
- ✅ Redirects to dashboard
- ✅ Session cookie present
- ✅ No "authentication required" errors

**Status**: [ ] Pass [ ] Fail

---

### Test 1.2: Access Token Presence
**Steps**:
1. Open browser console (F12)
2. Check: `sessionStorage` and `localStorage`
3. Go to Application tab → Cookies

**Expected**:
- ✅ Session cookie exists
- ⚠️ Access token may be missing (known issue - app works without it)

**Status**: [ ] Pass [ ] Fail

---

## 👑 2. SUPER_ADMIN Role Tests

### Test 2.1: Admin Dashboard Access
**URL**: http://localhost:3001/admin

**Expected**:
- ✅ Can access admin dashboard
- ✅ See dashboard stats
- ✅ See user list

**Status**: [ ] Pass [ ] Fail

---

### Test 2.2: User Management
**URL**: http://localhost:3001/admin/users

**Expected**:
- ✅ Can view all users
- ✅ See user roles
- ⚠️ Edit role button (TO BE IMPLEMENTED)

**Status**: [ ] Pass [ ] Fail

---

### Test 2.3: View All Tenants' Events
**URL**: http://localhost:3001/events

**Expected**:
- ✅ See events from ALL tenants
- ✅ No tenant filtering applied
- ✅ Can access any event

**Status**: [ ] Pass [ ] Fail

---

### Test 2.4: Delete Any Event
**URL**: http://localhost:3001/events/1/info

**Steps**:
1. Click "Delete" button
2. Confirm deletion

**Expected**:
- ✅ No "authentication required" error
- ✅ Event deleted successfully
- ✅ Redirects to events list

**Status**: [ ] Pass [ ] Fail

---

### Test 2.5: Create Event
**URL**: http://localhost:3001/dashboard → Click "Create Event"

**Steps**:
1. Fill in event details
2. Click "Create Event"

**Expected**:
- ✅ Event created successfully
- ✅ Redirects to event info page
- ✅ Event appears in list

**Status**: [ ] Pass [ ] Fail

---

## 👔 3. ADMIN Role Tests

### Test 3.1: Create Test ADMIN User
**SQL**:
```sql
docker compose exec postgres psql -U postgres -d event_planner

INSERT INTO "User" (email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'admin@test.com',
  'Test Admin',
  '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52',
  'ADMIN',
  NOW(),
  NOW(),
  NOW()
);
```

**Status**: [ ] Done

---

### Test 3.2: Login as ADMIN
**Steps**:
1. Logout from SUPER_ADMIN
2. Login as: admin@test.com / password123

**Expected**:
- ✅ Can login
- ✅ Redirects to dashboard

**Status**: [ ] Pass [ ] Fail

---

### Test 3.3: Admin Dashboard Access
**URL**: http://localhost:3001/admin

**Expected**:
- ✅ Can access admin dashboard
- ✅ See users in their tenant only
- ❌ Cannot see other tenants' users

**Status**: [ ] Pass [ ] Fail

---

### Test 3.4: Event Access (Same Tenant)
**URL**: http://localhost:3001/events

**Expected**:
- ✅ See events in their tenant
- ❌ Cannot see other tenants' events
- ✅ Can create events

**Status**: [ ] Pass [ ] Fail

---

### Test 3.5: Delete Event (Same Tenant)
**URL**: http://localhost:3001/events/{id}/info

**Expected**:
- ✅ Can delete events in their tenant
- ❌ Cannot delete other tenants' events

**Status**: [ ] Pass [ ] Fail

---

## 📅 4. EVENT_MANAGER Role Tests

### Test 4.1: Create Test EVENT_MANAGER User
**SQL**:
```sql
INSERT INTO "User" (email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'manager@test.com',
  'Test Manager',
  '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52',
  'EVENT_MANAGER',
  NOW(),
  NOW(),
  NOW()
);
```

**Status**: [ ] Done

---

### Test 4.2: Login as EVENT_MANAGER
**Steps**:
1. Logout
2. Login as: manager@test.com / password123

**Expected**:
- ✅ Can login
- ✅ Redirects to dashboard

**Status**: [ ] Pass [ ] Fail

---

### Test 4.3: Admin Dashboard Access
**URL**: http://localhost:3001/admin

**Expected**:
- ❌ Cannot access admin dashboard
- ✅ Shows "Forbidden" or redirects

**Status**: [ ] Pass [ ] Fail

---

### Test 4.4: Create Event
**URL**: http://localhost:3001/dashboard → Click "Create Event"

**Expected**:
- ✅ Can create events
- ✅ Event saved successfully

**Status**: [ ] Pass [ ] Fail

---

### Test 4.5: Manage Own Events
**URL**: http://localhost:3001/events

**Expected**:
- ✅ See their own events
- ✅ Can edit their events
- ❌ Cannot see other managers' events (same tenant)

**Status**: [ ] Pass [ ] Fail

---

### Test 4.6: Delete Own Event
**URL**: http://localhost:3001/events/{id}/info

**Expected**:
- ✅ Can delete their own events
- ❌ Cannot delete others' events

**Status**: [ ] Pass [ ] Fail

---

## 👤 5. USER Role Tests

### Test 5.1: Create Test USER
**SQL**:
```sql
INSERT INTO "User" (email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'user@test.com',
  'Test User',
  '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52',
  'USER',
  NOW(),
  NOW(),
  NOW()
);
```

**Status**: [ ] Done

---

### Test 5.2: Login as USER
**Steps**:
1. Logout
2. Login as: user@test.com / password123

**Expected**:
- ✅ Can login
- ✅ Redirects to dashboard

**Status**: [ ] Pass [ ] Fail

---

### Test 5.3: View Events
**URL**: http://localhost:3001/events

**Expected**:
- ✅ Can view public events
- ✅ Can search events

**Status**: [ ] Pass [ ] Fail

---

### Test 5.4: Create Event
**URL**: http://localhost:3001/dashboard

**Expected**:
- ❌ No "Create Event" button visible
- ❌ Cannot access /events/new directly

**Status**: [ ] Pass [ ] Fail

---

### Test 5.5: Register for Event
**URL**: http://localhost:3001/events/{id}

**Expected**:
- ✅ Can view event details
- ✅ Can register for event
- ❌ Cannot edit event

**Status**: [ ] Pass [ ] Fail

---

## 📝 6. Event CRUD Operations (as SUPER_ADMIN)

### Test 6.1: CREATE Event
**URL**: http://localhost:3001/events/new

**Steps**:
1. Fill in all fields:
   - Name: "Test Event CRUD"
   - City: "Mumbai"
   - Venue: "Test Venue"
   - Starts At: Future date
   - Ends At: Future date
   - Price: 500
   - Mode: IN_PERSON
2. Click "Create Event"

**Expected**:
- ✅ Event created
- ✅ Redirects to event info
- ✅ All fields saved correctly

**Status**: [ ] Pass [ ] Fail

---

### Test 6.2: READ Event
**URL**: http://localhost:3001/events/{id}/info

**Expected**:
- ✅ All event details displayed
- ✅ Correct values shown
- ✅ Map preview (if coordinates available)

**Status**: [ ] Pass [ ] Fail

---

### Test 6.3: UPDATE Event
**URL**: http://localhost:3001/events/{id}/info

**Steps**:
1. Change name to "Updated Test Event"
2. Change price to 750
3. Click "Save changes"

**Expected**:
- ✅ Success message shown
- ✅ Changes saved
- ✅ Refresh shows updated values

**Status**: [ ] Pass [ ] Fail

---

### Test 6.4: DELETE Event
**URL**: http://localhost:3001/events/{id}/info

**Steps**:
1. Click "Delete"
2. Confirm

**Expected**:
- ✅ Event deleted
- ✅ Redirects to events list
- ✅ Event no longer appears

**Status**: [ ] Pass [ ] Fail

---

## 👥 7. Event Team Management

### Test 7.1: Invite Team Member
**URL**: http://localhost:3001/events/{id}/team

**Steps**:
1. Click "Invite Event Members"
2. Enter email: "newmember@test.com"
3. Select role: "Coordinator"
4. Click "Invite"

**Expected**:
- ✅ Invitation sent
- ✅ Member appears in list with "Invited" status
- ✅ "Resend invite" button visible

**Status**: [ ] Pass [ ] Fail

---

### Test 7.2: Approve Team Member
**Steps**:
1. Find invited member
2. Click "Approve"

**Expected**:
- ✅ Status changes to "Joined"
- ✅ Success message shown

**Status**: [ ] Pass [ ] Fail

---

### Test 7.3: Edit Team Member Role
**Steps**:
1. Click "Edit" on a member
2. Change role to "Event Staff"
3. Save

**Expected**:
- ✅ Role updated
- ✅ Changes reflected immediately

**Status**: [ ] Pass [ ] Fail

---

### Test 7.4: Remove Team Member
**Steps**:
1. Click "Remove" on a member
2. Confirm

**Expected**:
- ✅ No "authentication token" error
- ✅ Member removed
- ✅ Success message shown

**Status**: [ ] Pass [ ] Fail

---

### Test 7.5: View Roles and Privileges
**Steps**:
1. Click "Roles and Privileges" tab

**Expected**:
- ✅ See all 4 roles
- ✅ See permissions for each
- ✅ See SUPER_ADMIN info box

**Status**: [ ] Pass [ ] Fail

---

## 🎤 8. Speakers CRUD

### Test 8.1: CREATE Speaker
**URL**: http://localhost:3001/events/{id}/speakers

**Steps**:
1. Click "Add Speaker"
2. Fill in:
   - Name: "John Doe"
   - Title: "Tech Lead"
   - Bio: "Expert in AI"
   - Photo URL: (optional)
3. Save

**Expected**:
- ✅ No 401 error
- ✅ Speaker created
- ✅ Appears in list

**Status**: [ ] Pass [ ] Fail

---

### Test 8.2: READ Speakers
**URL**: http://localhost:3001/events/{id}/speakers

**Expected**:
- ✅ All speakers listed
- ✅ Details visible
- ✅ Photos displayed (if URLs provided)

**Status**: [ ] Pass [ ] Fail

---

### Test 8.3: UPDATE Speaker
**Steps**:
1. Click "Edit" on a speaker
2. Change title to "Senior Tech Lead"
3. Save

**Expected**:
- ✅ Changes saved
- ✅ Updated info displayed

**Status**: [ ] Pass [ ] Fail

---

### Test 8.4: DELETE Speaker
**Steps**:
1. Click "Delete" on a speaker
2. Confirm

**Expected**:
- ✅ Speaker removed
- ✅ No longer in list

**Status**: [ ] Pass [ ] Fail

---

## 🏢 9. Sponsors CRUD

### Test 9.1: CREATE Sponsor
**URL**: http://localhost:3001/events/{id}/sponsors

**Steps**:
1. Click "Add Sponsor"
2. Fill in:
   - Name: "TechCorp"
   - Tier: "Gold"
   - Logo URL: (optional)
   - Website: "https://techcorp.com"
3. Save

**Expected**:
- ✅ No 401 error
- ✅ Sponsor created
- ✅ Appears in list

**Status**: [ ] Pass [ ] Fail

---

### Test 9.2: READ Sponsors
**URL**: http://localhost:3001/events/{id}/sponsors

**Expected**:
- ✅ All sponsors listed
- ✅ Tier badges visible
- ✅ Logos displayed

**Status**: [ ] Pass [ ] Fail

---

### Test 9.3: UPDATE Sponsor
**Steps**:
1. Click "Edit" on a sponsor
2. Change tier to "Platinum"
3. Save

**Expected**:
- ✅ Changes saved
- ✅ Tier badge updated

**Status**: [ ] Pass [ ] Fail

---

### Test 9.4: DELETE Sponsor
**Steps**:
1. Click "Delete" on a sponsor
2. Confirm

**Expected**:
- ✅ Sponsor removed
- ✅ No longer in list

**Status**: [ ] Pass [ ] Fail

---

## 📅 10. Sessions CRUD

### Test 10.1: CREATE Session
**URL**: http://localhost:3001/events/{id}/sessions

**Steps**:
1. Click "Add Session"
2. Fill in:
   - Title: "AI Workshop"
   - Description: "Learn AI basics"
   - Start Time: Future time
   - Duration: 60 minutes
   - Room: "Hall A"
3. Save

**Expected**:
- ✅ Session created
- ✅ Appears in schedule

**Status**: [ ] Pass [ ] Fail

---

### Test 10.2: READ Sessions
**URL**: http://localhost:3001/events/{id}/sessions

**Expected**:
- ✅ All sessions listed
- ✅ Schedule view available
- ✅ Times displayed correctly

**Status**: [ ] Pass [ ] Fail

---

### Test 10.3: UPDATE Session
**Steps**:
1. Click "Edit" on a session
2. Change duration to 90 minutes
3. Save

**Expected**:
- ✅ Changes saved
- ✅ Schedule updated

**Status**: [ ] Pass [ ] Fail

---

### Test 10.4: DELETE Session
**Steps**:
1. Click "Delete" on a session
2. Confirm

**Expected**:
- ✅ Session removed
- ✅ Schedule updated

**Status**: [ ] Pass [ ] Fail

---

## 🏪 11. Exhibitors CRUD

### Test 11.1: CREATE Exhibitor
**URL**: http://localhost:3001/events/{id}/exhibitors (if exists)

**Steps**:
1. Click "Add Exhibitor"
2. Fill in:
   - Name: "Tech Booth"
   - Description: "Latest tech"
   - Booth Number: "A-101"
3. Save

**Expected**:
- ✅ Exhibitor created
- ✅ Appears in list

**Status**: [ ] Pass [ ] Fail [ ] Not Implemented

---

### Test 11.2: READ Exhibitors
**Expected**:
- ✅ All exhibitors listed
- ✅ Booth numbers visible

**Status**: [ ] Pass [ ] Fail [ ] Not Implemented

---

### Test 11.3: UPDATE Exhibitor
**Steps**:
1. Edit exhibitor
2. Change booth number
3. Save

**Expected**:
- ✅ Changes saved

**Status**: [ ] Pass [ ] Fail [ ] Not Implemented

---

### Test 11.4: DELETE Exhibitor
**Steps**:
1. Delete exhibitor
2. Confirm

**Expected**:
- ✅ Exhibitor removed

**Status**: [ ] Pass [ ] Fail [ ] Not Implemented

---

## 📋 12. Registrations Management

### Test 12.1: View Registrations
**URL**: http://localhost:3001/events/{id}/registrations

**Expected**:
- ✅ List of registrations
- ✅ Attendee details
- ✅ Status (Confirmed, Pending, etc.)

**Status**: [ ] Pass [ ] Fail [ ] Not Implemented

---

### Test 12.2: Check-in Attendee
**Steps**:
1. Find attendee
2. Click "Check-in"

**Expected**:
- ✅ Status changes to "Checked In"
- ✅ Timestamp recorded

**Status**: [ ] Pass [ ] Fail [ ] Not Implemented

---

### Test 12.3: Export Registrations
**Steps**:
1. Click "Export" button

**Expected**:
- ✅ CSV/Excel file downloaded
- ✅ All attendee data included

**Status**: [ ] Pass [ ] Fail [ ] Not Implemented

---

## 🏢 13. Cross-Tenant Access Control

### Test 13.1: Create Second Tenant Event
**SQL**:
```sql
INSERT INTO events (
  name, city, tenant_id, status, event_mode,
  starts_at, ends_at, expected_attendees, created_at, updated_at
)
VALUES (
  'Tenant 2 Event',
  'Delhi',
  'tenant-2',
  'DRAFT',
  'IN_PERSON',
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '11 days',
  150,
  NOW(),
  NOW()
);
```

**Status**: [ ] Done

---

### Test 13.2: SUPER_ADMIN Access
**URL**: http://localhost:3001/events

**Expected**:
- ✅ See events from tenant-1
- ✅ See events from tenant-2
- ✅ Can access both

**Status**: [ ] Pass [ ] Fail

---

### Test 13.3: ADMIN Access (Tenant 1)
**Login as**: admin@test.com

**Expected**:
- ✅ See only tenant-1 events
- ❌ Cannot see tenant-2 events

**Status**: [ ] Pass [ ] Fail

---

### Test 13.4: EVENT_MANAGER Access
**Login as**: manager@test.com

**Expected**:
- ✅ See only their tenant events
- ❌ Cannot see other tenants

**Status**: [ ] Pass [ ] Fail

---

## 📊 Test Results Summary

### By Role
- **SUPER_ADMIN**: [ ] / [ ] tests passed
- **ADMIN**: [ ] / [ ] tests passed
- **EVENT_MANAGER**: [ ] / [ ] tests passed
- **USER**: [ ] / [ ] tests passed

### By Feature
- **Authentication**: [ ] / [ ] tests passed
- **Events CRUD**: [ ] / [ ] tests passed
- **Team Management**: [ ] / [ ] tests passed
- **Speakers**: [ ] / [ ] tests passed
- **Sponsors**: [ ] / [ ] tests passed
- **Sessions**: [ ] / [ ] tests passed
- **Exhibitors**: [ ] / [ ] tests passed
- **Registrations**: [ ] / [ ] tests passed
- **Tenant Isolation**: [ ] / [ ] tests passed

---

## 🔧 Missing Implementations Found

### High Priority
1. [ ] Admin UI for role management
2. [ ] Exhibitors UI (if not present)
3. [ ] Registration check-in functionality
4. [ ] Export registrations feature

### Medium Priority
5. [ ] Event ownership validation
6. [ ] Tenant switching for SUPER_ADMIN
7. [ ] Audit logs for admin actions

### Low Priority
8. [ ] Bulk invite team members
9. [ ] Email notifications for invites
10. [ ] Advanced search/filters

---

## 🚀 How to Run Tests

1. **Setup Test Users**:
```bash
# Run SQL commands to create test users
docker compose exec postgres psql -U postgres -d event_planner < test_users.sql
```

2. **Open Chromium**:
```bash
# Mac
open -a "Google Chrome" http://localhost:3001

# Or use Chromium directly
chromium-browser http://localhost:3001
```

3. **Run Tests Manually**:
- Follow each test step
- Mark Pass/Fail
- Note any issues

4. **Document Results**:
- Update this file with results
- Create issues for failures
- Implement missing features

---

## 📝 Notes

- Test in order (authentication first)
- Clear cookies between role tests
- Take screenshots of failures
- Document any unexpected behavior
- Check browser console for errors
