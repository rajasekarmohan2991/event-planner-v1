# 🧪 Full Application Testing - Step by Step

## 🔧 Fixes Applied

### Issue 1: Auth Pages Metadata Error ✅ FIXED
**Problem**: viewport and themeColor in metadata causing 500 errors  
**Solution**: Moved to separate viewport export  
**Files Fixed**:
- `/auth/register/page.tsx`
- `/auth/forgot-password/page.tsx`

---

## 📋 Complete Testing Workflow

### Phase 1: User Registration & Authentication

#### Step 1: Register New User
```
URL: http://localhost:3001/auth/register

Actions:
1. Fill in registration form:
   - Name: Test User
   - Email: testuser@example.com
   - Password: Password123!
   
2. Click "Sign Up"

Expected Results:
✅ Account created successfully
✅ Redirected to dashboard
✅ User menu visible (not "Sign In" button)
✅ Welcome message displayed

Test Status: [ ] PASS [ ] FAIL
Notes: _______________________
```

#### Step 2: Logout
```
Actions:
1. Click user menu (top right)
2. Click "Logout"

Expected Results:
✅ Logged out successfully
✅ Redirected to home page
✅ "Sign In" button visible

Test Status: [ ] PASS [ ] FAIL
```

#### Step 3: Login
```
URL: http://localhost:3001/auth/login

Actions:
1. Enter credentials:
   - Email: testuser@example.com
   - Password: Password123!
   
2. Click "Sign In"

Expected Results:
✅ Login successful
✅ Redirected to dashboard
✅ User menu visible

Test Status: [ ] PASS [ ] FAIL
```

#### Step 4: Forgot Password
```
URL: http://localhost:3001/auth/forgot-password

Actions:
1. Enter email: testuser@example.com
2. Click "Send reset link"
3. Check console for Ethereal email URL
4. Click reset link in email
5. Enter new password
6. Click "Reset Password"

Expected Results:
✅ Reset email sent
✅ Email received with link
✅ Reset page loads
✅ Password changed successfully
✅ Redirected to login
✅ Can login with new password

Test Status: [ ] PASS [ ] FAIL
```

---

### Phase 2: Event Management

#### Step 5: Create Event
```
URL: http://localhost:3001/events

Actions:
1. Click "Create Event" button
2. Fill in event details:
   - Name: Tech Conference 2024
   - Type: Conference
   - Start Date: [Future date]
   - End Date: [Future date]
   - Location: Convention Center
   - Description: Annual tech conference
   
3. Click "Create"

Expected Results:
✅ Event created successfully
✅ Redirected to event details page
✅ Event appears in events list
✅ Event status is DRAFT

Test Status: [ ] PASS [ ] FAIL
Event ID: _______
```

#### Step 6: Edit Event
```
URL: http://localhost:3001/events/[EVENT_ID]/settings

Actions:
1. Navigate to event settings
2. Modify event name
3. Change description
4. Click "Save Changes"

Expected Results:
✅ Changes saved successfully
✅ Success message displayed
✅ Changes reflected in event details

Test Status: [ ] PASS [ ] FAIL
```

#### Step 7: Publish Event
```
URL: http://localhost:3001/events/[EVENT_ID]

Actions:
1. Click "Publish Event" button
2. Review publish checklist
3. Click "Publish"

Expected Results:
✅ Event status changes to LIVE
✅ Success message displayed
✅ Public URL becomes accessible
✅ Event visible in public listings

Test Status: [ ] PASS [ ] FAIL
```

---

### Phase 3: Registration Settings

#### Step 8: Configure Registration Settings
```
URL: http://localhost:3001/events/[EVENT_ID]/registrations/settings

Actions:
1. Toggle "Registration Approval" ON
2. Toggle "Cancellation Approval" ON
3. Toggle "Allow Transfer" ON
4. Set "Time Limit" to 30 minutes
5. Select "Restrict Duplicates" to "Per Event"
6. Toggle "Show Ticket Availability" ON
7. Click "Save Changes"

Expected Results:
✅ All toggles work
✅ Settings saved successfully
✅ Success message displayed
✅ Refresh page - settings persist

Test Status: [ ] PASS [ ] FAIL
```

#### Step 9: Test Registration Approvals
```
URL: http://localhost:3001/events/[EVENT_ID]/registrations/approvals

Actions:
1. Create test registration (via public page)
2. Go to approvals page
3. View pending registrations
4. Click "Approve" on a registration
5. Verify status changes

Expected Results:
✅ Pending registrations listed
✅ Approve button works
✅ Status updates to APPROVED
✅ Success message displayed

Test Status: [ ] PASS [ ] FAIL
```

#### Step 10: Test Cancellation Approvals
```
URL: http://localhost:3001/events/[EVENT_ID]/registrations/cancellation-approvals

Actions:
1. Cancel a test registration
2. Go to cancellation approvals
3. View cancelled registrations
4. Click "Approve" on cancellation
5. Verify approval stored

Expected Results:
✅ Cancelled registrations listed
✅ Approve button works
✅ Decision stored
✅ Success message displayed

Test Status: [ ] PASS [ ] FAIL
```

---

### Phase 4: Communication Features

#### Step 11: Send Email Invitations
```
URL: http://localhost:3001/events/[EVENT_ID]/communicate

Actions:
1. Go to "Email Invites" tab
2. Enter emails: test1@example.com, test2@example.com
3. Click "Send Invites"
4. Check console for Ethereal preview URL
5. View email template

Expected Results:
✅ Invites sent successfully
✅ Success message with count
✅ Email preview available
✅ Template looks professional
✅ Registration link works

Test Status: [ ] PASS [ ] FAIL
```

#### Step 12: Send Bulk Email
```
URL: http://localhost:3001/events/[EVENT_ID]/communicate

Actions:
1. Scroll to "Email All Attendees"
2. Edit subject: "Event Update"
3. Edit message: "Important information"
4. Click "Send to All Attendees"

Expected Results:
✅ Emails sent to all attendees
✅ Success message with count
✅ No errors in console

Test Status: [ ] PASS [ ] FAIL
```

#### Step 13: Test Social Sharing
```
URL: http://localhost:3001/events/[EVENT_ID]/communicate

Actions:
1. Go to "Social Share" tab
2. Click "Copy" button
3. Verify link copied
4. Click "Facebook" button
5. Click "Twitter" button
6. Click "LinkedIn" button

Expected Results:
✅ Copy button shows "Copied!"
✅ Link in clipboard
✅ Facebook share dialog opens
✅ Twitter share dialog opens
✅ LinkedIn share dialog opens

Test Status: [ ] PASS [ ] FAIL
```

---

### Phase 5: Sessions Management

#### Step 14: Create Session
```
URL: http://localhost:3001/events/[EVENT_ID]/sessions

Actions:
1. Fill in session form:
   - Title: Opening Keynote
   - Track: Main Stage
   - Start Time: [Future time]
   - End Time: [Future time]
   - Capacity: 100
   - Room: Hall A
   
2. Click "Add Session"

Expected Results:
✅ Session created successfully
✅ Session appears in list
✅ All details displayed correctly

Test Status: [ ] PASS [ ] FAIL
```

---

### Phase 6: Team Management

#### Step 15: Invite Team Member
```
URL: http://localhost:3001/events/[EVENT_ID]/settings/team

Actions:
1. Enter email: teammate@example.com
2. Select role: ORGANIZER
3. Click "Invite"

Expected Results:
✅ Invitation sent
✅ Team member appears in list
✅ Email sent to teammate

Test Status: [ ] PASS [ ] FAIL
```

---

### Phase 7: Public Registration

#### Step 16: Test Public Registration
```
URL: http://localhost:3001/events/[EVENT_ID]/public

Actions:
1. Fill in registration form:
   - Name: Public User
   - Email: public@example.com
   - Additional fields as required
   
2. Click "Register"

Expected Results:
✅ Registration form loads
✅ Event details displayed
✅ Registration successful
✅ Confirmation message shown
✅ Confirmation email sent

Test Status: [ ] PASS [ ] FAIL
```

---

### Phase 8: Statistics & Analytics

#### Step 17: View Event Statistics
```
URL: http://localhost:3001/events/[EVENT_ID]

Actions:
1. View dashboard statistics
2. Check registration trend chart
3. Verify ticket sales count
4. Check days to event

Expected Results:
✅ Statistics load without errors
✅ Trend chart displays
✅ Counts are accurate
✅ No 500 errors in console

Test Status: [ ] PASS [ ] FAIL
```

---

### Phase 9: Error Handling

#### Step 18: Test Invalid Inputs
```
Actions:
1. Try registering with invalid email
2. Try creating event with missing required fields
3. Try accessing unauthorized pages
4. Try invalid password reset token

Expected Results:
✅ Validation errors displayed
✅ Clear error messages
✅ No application crashes
✅ Proper 401/403 responses

Test Status: [ ] PASS [ ] FAIL
```

---

### Phase 10: Performance & UI

#### Step 19: Check Page Load Times
```
Actions:
1. Measure load time for each major page
2. Check for loading states
3. Verify responsive design
4. Test on mobile viewport

Expected Results:
✅ All pages load < 3 seconds
✅ Loading states show properly
✅ Mobile responsive
✅ No layout shifts

Test Status: [ ] PASS [ ] FAIL
```

#### Step 20: Browser Console Check
```
Actions:
1. Open browser console (F12)
2. Navigate through all pages
3. Check for errors

Expected Results:
✅ No 403 errors
✅ No 404 errors
✅ No 500 errors
✅ No JavaScript errors
✅ No React warnings (except expected)

Test Status: [ ] PASS [ ] FAIL
```

---

## 📊 Test Summary

### Results:
- Total Tests: 20
- Passed: ___ / 20
- Failed: ___ / 20
- Success Rate: ____%

### Critical Issues Found:
1. ______________________________
2. ______________________________
3. ______________________________

### Minor Issues Found:
1. ______________________________
2. ______________________________
3. ______________________________

### Recommendations:
1. ______________________________
2. ______________________________
3. ______________________________

---

## ✅ Sign-Off

**Tester Name**: _______________________  
**Date**: _______________________  
**Overall Status**: [ ] PASS [ ] FAIL  
**Ready for Demo**: [ ] YES [ ] NO  

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________

---

## 🚀 Quick Test Commands

```bash
# Check services
docker compose ps

# View logs
docker compose logs web --tail=50
docker compose logs api --tail=50

# Restart services
docker compose restart

# Run automated tests
./test-all.sh

# Access application
open http://localhost:3001
```

---

**Last Updated**: October 21, 2025
