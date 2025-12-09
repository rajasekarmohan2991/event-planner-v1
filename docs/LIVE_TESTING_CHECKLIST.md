# 🧪 LIVE TESTING CHECKLIST - Execute Now!

## ✅ Test Users Created Successfully!

```
Email                    | Name               | Role
-------------------------+--------------------+---------------
rbusiness2111@gmail.com  | Rajasekar Mohan    | SUPER_ADMIN
admin@test.com           | Test Admin         | ADMIN
manager@test.com         | Test Event Manager | EVENT_MANAGER
user@test.com            | Test Regular User  | USER
```

**All passwords**: `password123` (except your SUPER_ADMIN)

---

## 🌐 Browser Preview Ready

**Click the browser preview button above to open**: http://localhost:3001

Or open manually in Chromium:
```bash
open -a "Google Chrome" http://localhost:3001
```

---

## 📋 TEST 1: SUPER_ADMIN (Your Account) - 3 mins

### 1.1 Login
- [ ] Go to http://localhost:3001/auth/login
- [ ] Login with: rbusiness2111@gmail.com
- [ ] **Expected**: Redirects to dashboard

### 1.2 Create Event Button Location
- [ ] Check dashboard: http://localhost:3001/dashboard
- [ ] **Expected**: ✅ See "Create Event" button (top right)
- [ ] Go to events list: http://localhost:3001/events
- [ ] **Expected**: ✅ NO "Create Event" button here

### 1.3 Delete Event (No Auth Error)
- [ ] Go to any event: http://localhost:3001/events/1/info
- [ ] Click "Delete" button
- [ ] Confirm deletion
- [ ] **Expected**: ✅ Works WITHOUT "authentication required" error
- [ ] **Expected**: ✅ Redirects to events list

### 1.4 Admin Dashboard Access
- [ ] Go to: http://localhost:3001/admin
- [ ] **Expected**: ✅ Can access admin dashboard
- [ ] **Expected**: ✅ See user list

### 1.5 All Features Accessible
- [ ] Team: http://localhost:3001/events/1/team
- [ ] Speakers: http://localhost:3001/events/1/speakers
- [ ] Sponsors: http://localhost:3001/events/1/sponsors
- [ ] **Expected**: ✅ All accessible

### 1.6 Browser Console Check
- [ ] Press F12 to open DevTools
- [ ] Check Console tab
- [ ] **Expected**: ✅ NO 401 errors
- [ ] **Expected**: ✅ NO "authentication token not found"

**SUPER_ADMIN Test Result**: ✅ PASS / ❌ FAIL

---

## 📋 TEST 2: USER Role (Restricted) - 2 mins

### 2.1 Logout and Login as USER
- [ ] Click logout
- [ ] Login with: user@test.com / password123
- [ ] **Expected**: ✅ Login successful

### 2.2 NO Create Event Button
- [ ] Go to dashboard: http://localhost:3001/dashboard
- [ ] **Expected**: ✅ NO "Create Event" button visible
- [ ] **This is correct!** USER role should NOT see this button

### 2.3 Cannot Access Admin
- [ ] Try: http://localhost:3001/admin
- [ ] **Expected**: ✅ Forbidden or redirect
- [ ] **Expected**: ✅ Cannot access

### 2.4 Cannot Create Event Directly
- [ ] Try: http://localhost:3001/events/new
- [ ] **Expected**: ✅ Forbidden or redirect
- [ ] **Expected**: ✅ Cannot access

### 2.5 Can View Events
- [ ] Go to: http://localhost:3001/events
- [ ] **Expected**: ✅ Can see event list
- [ ] **Expected**: ✅ Can click and view event details

**USER Role Test Result**: ✅ PASS / ❌ FAIL

---

## 📋 TEST 3: EVENT_MANAGER (Can Create) - 3 mins

### 3.1 Logout and Login as EVENT_MANAGER
- [ ] Click logout
- [ ] Login with: manager@test.com / password123
- [ ] **Expected**: ✅ Login successful

### 3.2 Can See Create Event Button
- [ ] Go to dashboard: http://localhost:3001/dashboard
- [ ] **Expected**: ✅ See "Create Event" button (top right)
- [ ] **This is correct!** EVENT_MANAGER should see this button

### 3.3 Can Create Event
- [ ] Click "Create Event" button
- [ ] Fill in event details:
  - Name: "Test Event by Manager"
  - City: "Mumbai"
  - Venue: "Test Venue"
  - Starts At: (future date)
  - Price: 500
- [ ] Click "Create Event"
- [ ] **Expected**: ✅ Event created successfully
- [ ] **Expected**: ✅ Redirects to event info page

### 3.4 Cannot Access Admin
- [ ] Try: http://localhost:3001/admin
- [ ] **Expected**: ✅ Forbidden or redirect
- [ ] **Expected**: ✅ Cannot access

### 3.5 Can Manage Own Events
- [ ] Go to events list
- [ ] Click the event you just created
- [ ] Try adding a speaker
- [ ] Try adding a sponsor
- [ ] **Expected**: ✅ All work

**EVENT_MANAGER Test Result**: ✅ PASS / ❌ FAIL

---

## 📋 TEST 4: ADMIN (Full Access) - 2 mins

### 4.1 Logout and Login as ADMIN
- [ ] Click logout
- [ ] Login with: admin@test.com / password123
- [ ] **Expected**: ✅ Login successful

### 4.2 Can Access Admin Dashboard
- [ ] Go to: http://localhost:3001/admin
- [ ] **Expected**: ✅ Can access
- [ ] **Expected**: ✅ See dashboard stats

### 4.3 Can Create Events
- [ ] Go to dashboard: http://localhost:3001/dashboard
- [ ] **Expected**: ✅ See "Create Event" button
- [ ] Click and create a test event
- [ ] **Expected**: ✅ Works

**ADMIN Test Result**: ✅ PASS / ❌ FAIL

---

## 📋 TEST 5: CRUD Operations - 5 mins

### 5.1 Login as SUPER_ADMIN
- [ ] Logout and login as: rbusiness2111@gmail.com

### 5.2 Events CRUD
**CREATE**:
- [ ] Dashboard → Click "Create Event"
- [ ] Fill: Name "CRUD Test Event", City "Delhi", Price 1000
- [ ] Click "Create Event"
- [ ] **Expected**: ✅ Event created

**READ**:
- [ ] Go to event info page
- [ ] **Expected**: ✅ All details displayed correctly

**UPDATE**:
- [ ] Change name to "CRUD Test Event Updated"
- [ ] Change price to 1500
- [ ] Click "Save changes"
- [ ] **Expected**: ✅ Success message
- [ ] Refresh page
- [ ] **Expected**: ✅ Changes saved

**DELETE**:
- [ ] Click "Delete" button
- [ ] Confirm
- [ ] **Expected**: ✅ Works WITHOUT auth error
- [ ] **Expected**: ✅ Event removed from list

### 5.3 Speakers CRUD
- [ ] Go to any event → Speakers tab
- [ ] Click "Add Speaker"
- [ ] Fill: Name "John Doe", Title "Tech Lead"
- [ ] Save
- [ ] **Expected**: ✅ NO 401 error
- [ ] **Expected**: ✅ Speaker appears in list
- [ ] Edit speaker, change title
- [ ] **Expected**: ✅ Changes saved
- [ ] Delete speaker
- [ ] **Expected**: ✅ Speaker removed

### 5.4 Sponsors CRUD
- [ ] Go to Sponsors tab
- [ ] Click "Add Sponsor"
- [ ] Fill: Name "TechCorp", Tier "Gold"
- [ ] Save
- [ ] **Expected**: ✅ NO 401 error
- [ ] **Expected**: ✅ Sponsor appears
- [ ] Edit sponsor, change tier to "Platinum"
- [ ] **Expected**: ✅ Changes saved
- [ ] Delete sponsor
- [ ] **Expected**: ✅ Sponsor removed

### 5.5 Team Management CRUD
- [ ] Go to Team tab
- [ ] Click "Invite Event Members"
- [ ] Enter email: "newmember@test.com"
- [ ] Select role: "Coordinator"
- [ ] Click "Invite"
- [ ] **Expected**: ✅ Member invited
- [ ] Click "Edit" on a member
- [ ] Change role to "Event Staff"
- [ ] **Expected**: ✅ Role updated
- [ ] Click "Remove" on a member
- [ ] Confirm
- [ ] **Expected**: ✅ NO "authentication token not found" error
- [ ] **Expected**: ✅ Member removed successfully

### 5.6 Roles and Privileges Tab
- [ ] Click "Roles and Privileges" tab
- [ ] **Expected**: ✅ See all 4 roles (Event Owner, Coordinator, Event Staff, Vendor)
- [ ] **Expected**: ✅ See permissions for each role
- [ ] **Expected**: ✅ See SUPER_ADMIN info box

**CRUD Operations Test Result**: ✅ PASS / ❌ FAIL

---

## 🔍 Browser Console Verification

### Open DevTools (F12)

#### Console Tab
- [ ] Check for errors
- [ ] **Expected**: ✅ NO "401 Unauthorized" errors
- [ ] **Expected**: ✅ NO "Authentication token not found"
- [ ] **Expected**: ✅ NO "Tenant ID required"

#### Network Tab
- [ ] Perform an action (e.g., save event)
- [ ] Click the request in Network tab
- [ ] Check Headers
- [ ] **Expected**: ✅ See `x-tenant-id` header
- [ ] **Expected**: ✅ See `x-user-role` header
- [ ] **Expected**: ✅ Status code 200 or 201 (not 401/403)

#### Application Tab → Cookies
- [ ] Check cookies
- [ ] **Expected**: ✅ See `next-auth.session-token` cookie

**Browser Console Check**: ✅ PASS / ❌ FAIL

---

## 📊 FINAL RESULTS

### Test Summary
- [ ] SUPER_ADMIN Tests: _____ / 6 passed
- [ ] USER Role Tests: _____ / 5 passed
- [ ] EVENT_MANAGER Tests: _____ / 5 passed
- [ ] ADMIN Tests: _____ / 3 passed
- [ ] CRUD Operations: _____ / 6 passed
- [ ] Browser Console: _____ / 3 passed

### Overall Result
**Total Tests Passed**: _____ / 28

**Status**: 
- [ ] ✅ ALL TESTS PASSED - Ready for production!
- [ ] ⚠️ SOME TESTS FAILED - Need fixes
- [ ] ❌ MANY TESTS FAILED - Major issues

---

## 🐛 Issues Found (if any)

### Issue 1:
**Description**: _________________________________
**Severity**: High / Medium / Low
**Steps to Reproduce**: _________________________________

### Issue 2:
**Description**: _________________________________
**Severity**: High / Medium / Low
**Steps to Reproduce**: _________________________________

### Issue 3:
**Description**: _________________________________
**Severity**: High / Medium / Low
**Steps to Reproduce**: _________________________________

---

## ✅ Success Criteria

**All tests pass when**:
- ✅ No 401/403 errors in console
- ✅ SUPER_ADMIN can delete events without auth error
- ✅ USER role cannot see Create Event button
- ✅ EVENT_MANAGER can create events
- ✅ ADMIN can access admin dashboard
- ✅ All CRUD operations work
- ✅ Team member removal works without auth error
- ✅ Roles and Privileges tab shows content

---

## 🎉 Testing Complete!

**Tested By**: _________________________________
**Date**: _________________________________
**Time Taken**: _________________________________
**Browser**: Chromium
**Result**: PASS / FAIL

**Notes**: _________________________________

---

## 📞 Quick Commands (if needed)

### View Logs
```bash
docker compose logs -f web
```

### Restart Web
```bash
docker compose restart web
```

### Check Users
```bash
docker compose exec postgres psql -U postgres -d event_planner -c "SELECT email, role FROM users;"
```

---

## 🚀 Ready to Test!

1. **Click the browser preview button** or open http://localhost:3001
2. **Follow each test step** in order
3. **Check boxes** as you complete each test
4. **Document any issues** in the Issues Found section
5. **Mark final result** at the bottom

**Good luck with testing!** 🎯
