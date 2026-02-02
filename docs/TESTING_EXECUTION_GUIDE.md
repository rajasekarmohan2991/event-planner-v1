# 🚀 Testing Execution Guide

## Setup Test Environment

### Step 1: Create Test Users
```bash
# Run the SQL script to create test users
docker compose exec postgres psql -U postgres -d event_planner -f /tmp/test_users.sql

# Or copy and paste the SQL directly
docker compose exec postgres psql -U postgres -d event_planner << 'EOF'
-- ADMIN
INSERT INTO "User" (id, email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES ('admin-test-001', 'admin@test.com', 'Test Admin', '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52', 'ADMIN', NOW(), NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', password = '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52';

-- EVENT_MANAGER
INSERT INTO "User" (id, email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES ('manager-test-001', 'manager@test.com', 'Test Event Manager', '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52', 'EVENT_MANAGER', NOW(), NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET role = 'EVENT_MANAGER', password = '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52';

-- USER
INSERT INTO "User" (id, email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES ('user-test-001', 'user@test.com', 'Test Regular User', '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52', 'USER', NOW(), NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET role = 'USER', password = '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52';

SELECT email, role FROM "User" WHERE email IN ('rbusiness2111@gmail.com', 'admin@test.com', 'manager@test.com', 'user@test.com');
EOF
```

### Step 2: Verify Test Users
```bash
docker compose exec postgres psql -U postgres -d event_planner -c "SELECT email, name, role FROM \"User\" WHERE email LIKE '%test.com' OR email = 'rbusiness2111@gmail.com';"
```

**Expected Output**:
```
email                    | name               | role
-------------------------+--------------------+---------------
rbusiness2111@gmail.com  | Raja               | SUPER_ADMIN
admin@test.com           | Test Admin         | ADMIN
manager@test.com         | Test Event Manager | EVENT_MANAGER
user@test.com            | Test Regular User  | USER
```

---

## 🧪 Quick Test Checklist

### Test Credentials
- **SUPER_ADMIN**: rbusiness2111@gmail.com / (your password)
- **ADMIN**: admin@test.com / password123
- **EVENT_MANAGER**: manager@test.com / password123
- **USER**: user@test.com / password123

---

## 🎯 Critical Tests to Run Now

### 1. SUPER_ADMIN Tests (5 mins)

#### Test 1.1: Delete Event
1. Login as SUPER_ADMIN
2. Go to http://localhost:3001/events
3. Click any event → Info tab
4. Click "Delete" button
5. ✅ **Expected**: Works without "authentication required" error

#### Test 1.2: Create Event Button Location
1. Go to http://localhost:3001/dashboard
2. ✅ **Expected**: See "Create Event" button (top right)
3. Go to http://localhost:3001/events
4. ✅ **Expected**: NO "Create Event" button here

#### Test 1.3: Access All Features
1. Try accessing:
   - http://localhost:3001/admin (Admin Dashboard)
   - http://localhost:3001/events/1/team (Team Management)
   - http://localhost:3001/events/1/speakers (Speakers)
   - http://localhost:3001/events/1/sponsors (Sponsors)
2. ✅ **Expected**: All accessible

---

### 2. USER Role Tests (3 mins)

#### Test 2.1: No Create Event Button
1. Logout from SUPER_ADMIN
2. Login as: user@test.com / password123
3. Go to http://localhost:3001/dashboard
4. ✅ **Expected**: NO "Create Event" button visible

#### Test 2.2: Cannot Access Admin
1. Try: http://localhost:3001/admin
2. ✅ **Expected**: Forbidden or redirect

#### Test 2.3: Cannot Create Event Directly
1. Try: http://localhost:3001/events/new
2. ✅ **Expected**: Forbidden or redirect

#### Test 2.4: Can View Events
1. Go to http://localhost:3001/events
2. ✅ **Expected**: Can see event list

---

### 3. EVENT_MANAGER Tests (3 mins)

#### Test 3.1: Can Create Events
1. Logout, login as: manager@test.com / password123
2. Go to http://localhost:3001/dashboard
3. ✅ **Expected**: See "Create Event" button
4. Click it, create a test event
5. ✅ **Expected**: Event created successfully

#### Test 3.2: Cannot Access Admin
1. Try: http://localhost:3001/admin
2. ✅ **Expected**: Forbidden or redirect

#### Test 3.3: Can Manage Own Events
1. Go to http://localhost:3001/events
2. Click event you created
3. Try editing, adding speakers, sponsors
4. ✅ **Expected**: All work

---

### 4. ADMIN Tests (3 mins)

#### Test 4.1: Can Access Admin Dashboard
1. Logout, login as: admin@test.com / password123
2. Go to http://localhost:3001/admin
3. ✅ **Expected**: Can access

#### Test 4.2: Can Create Events
1. Go to http://localhost:3001/dashboard
2. ✅ **Expected**: See "Create Event" button
3. Create event
4. ✅ **Expected**: Works

---

### 5. CRUD Operations (10 mins)

#### Test 5.1: Events CRUD
1. Login as SUPER_ADMIN
2. **CREATE**: Dashboard → Create Event → Fill form → Save
3. **READ**: Go to event info page → Verify all fields
4. **UPDATE**: Edit name, price → Save → Verify changes
5. **DELETE**: Click Delete → Confirm → Verify removed

#### Test 5.2: Speakers CRUD
1. Go to event → Speakers tab
2. **CREATE**: Add Speaker → Fill form → Save
3. **READ**: Verify speaker appears
4. **UPDATE**: Edit speaker → Change title → Save
5. **DELETE**: Delete speaker → Confirm

#### Test 5.3: Sponsors CRUD
1. Go to event → Sponsors tab
2. **CREATE**: Add Sponsor → Fill form → Save
3. **READ**: Verify sponsor appears
4. **UPDATE**: Edit sponsor → Change tier → Save
5. **DELETE**: Delete sponsor → Confirm

#### Test 5.4: Team Members CRUD
1. Go to event → Team tab
2. **CREATE**: Invite member → Enter email → Select role → Invite
3. **READ**: Verify member in list
4. **UPDATE**: Edit member → Change role → Save
5. **DELETE**: Remove member → Confirm (should work without auth error)

---

## 🔍 Browser Console Checks

### Open Browser Console (F12)

#### Check for Errors
```javascript
// Should see NO errors like:
// ❌ 401 Unauthorized
// ❌ Authentication token not found
// ❌ Tenant ID required
```

#### Check Session
```javascript
// In console, run:
document.cookie

// Should see something like:
// "next-auth.session-token=..."
```

#### Check Network Tab
1. Open Network tab
2. Perform action (e.g., delete event)
3. Check request headers:
   - ✅ Should have `x-tenant-id`
   - ✅ Should have `x-user-role`
   - ⚠️ May not have `Authorization` (that's OK, app works without it)

---

## 📊 Feature Implementation Status

### ✅ Implemented & Working
- [x] Authentication & Session
- [x] Role-based access control (RBAC)
- [x] Events CRUD
- [x] Speakers CRUD
- [x] Sponsors CRUD
- [x] Team Management
- [x] Sessions Management
- [x] Exhibitors Management
- [x] Settings Pages
- [x] Dashboard
- [x] Create Event button on dashboard
- [x] Role-based Create Event button visibility

### ⚠️ Partially Implemented
- [ ] Admin UI for role management (shows users, but no edit button)
- [ ] Registration check-in UI
- [ ] Export registrations feature
- [ ] Tenant switching for SUPER_ADMIN

### ❌ Not Implemented
- [ ] Email notifications for invites
- [ ] Bulk operations
- [ ] Advanced search/filters
- [ ] Audit logs

---

## 🐛 Known Issues & Fixes

### Issue 1: "Authentication token not found"
**Status**: ✅ FIXED
**Fix**: Removed accessToken checks from delete operations

### Issue 2: Duplicate "Resend invite" button
**Status**: ✅ FIXED
**Fix**: Removed from Status column, kept in Actions column

### Issue 3: Image preview on Event Info
**Status**: ✅ FIXED
**Fix**: Removed map/image preview section

### Issue 4: Roles and Privileges tab empty
**Status**: ✅ FIXED
**Fix**: Implemented full role documentation

### Issue 5: Create Event button on wrong page
**Status**: ✅ FIXED
**Fix**: Moved from events list to dashboard

### Issue 6: USER role sees Create Event button
**Status**: ✅ FIXED
**Fix**: Added role-based visibility check

---

## 🎬 Testing Workflow

### Morning Testing Session (30 mins)
1. ✅ Setup test users (5 mins)
2. ✅ Test SUPER_ADMIN (5 mins)
3. ✅ Test USER role (5 mins)
4. ✅ Test EVENT_MANAGER (5 mins)
5. ✅ Test ADMIN (5 mins)
6. ✅ Test CRUD operations (5 mins)

### Afternoon Testing Session (30 mins)
7. ✅ Test all event features (10 mins)
8. ✅ Test team management (5 mins)
9. ✅ Test speakers/sponsors (5 mins)
10. ✅ Test cross-tenant access (5 mins)
11. ✅ Document findings (5 mins)

---

## 📝 Test Results Template

### Test Date: _____________
### Tester: _____________
### Browser: Chromium

#### SUPER_ADMIN Tests
- [ ] Delete event: PASS / FAIL
- [ ] Create button location: PASS / FAIL
- [ ] Access all features: PASS / FAIL

#### USER Tests
- [ ] No create button: PASS / FAIL
- [ ] Cannot access admin: PASS / FAIL
- [ ] Can view events: PASS / FAIL

#### EVENT_MANAGER Tests
- [ ] Can create events: PASS / FAIL
- [ ] Cannot access admin: PASS / FAIL
- [ ] Can manage events: PASS / FAIL

#### ADMIN Tests
- [ ] Can access admin: PASS / FAIL
- [ ] Can create events: PASS / FAIL

#### CRUD Tests
- [ ] Events CRUD: PASS / FAIL
- [ ] Speakers CRUD: PASS / FAIL
- [ ] Sponsors CRUD: PASS / FAIL
- [ ] Team CRUD: PASS / FAIL

#### Issues Found
1. _______________________________
2. _______________________________
3. _______________________________

---

## 🚀 Next Steps After Testing

### If All Tests Pass
1. ✅ Mark all features as verified
2. ✅ Document any edge cases
3. ✅ Create user guide
4. ✅ Prepare for demo

### If Tests Fail
1. ❌ Document exact failure
2. ❌ Check browser console
3. ❌ Check server logs
4. ❌ Create fix
5. ❌ Retest

---

## 📞 Quick Commands

### View Logs
```bash
# Web container
docker compose logs -f web

# API container
docker compose logs -f api

# All containers
docker compose logs -f
```

### Restart Services
```bash
# Restart web only
docker compose restart web

# Rebuild and restart
docker compose up --build -d web

# Restart all
docker compose restart
```

### Database Queries
```bash
# Check users
docker compose exec postgres psql -U postgres -d event_planner -c "SELECT email, role FROM \"User\";"

# Check events
docker compose exec postgres psql -U postgres -d event_planner -c "SELECT id, name, status, tenant_id FROM events;"

# Check team members
docker compose exec postgres psql -U postgres -d event_planner -c "SELECT * FROM event_team_members LIMIT 10;"
```

---

## ✅ Final Checklist

Before marking testing complete:

- [ ] All test users created
- [ ] All 4 roles tested
- [ ] All CRUD operations verified
- [ ] No console errors
- [ ] No 401/403 errors
- [ ] Role-based UI working
- [ ] Create Event button in correct location
- [ ] Delete works without auth error
- [ ] Team management works
- [ ] Speakers/Sponsors work
- [ ] Settings accessible
- [ ] Cross-tenant isolation verified (if applicable)

**Testing Complete**: YES / NO

**Ready for Demo**: YES / NO

**Notes**: _________________________________
