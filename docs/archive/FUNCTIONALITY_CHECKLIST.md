# Complete Functionality Checklist - Dec 9, 2025

## ✅ Issues Fixed Today
1. ✅ **rsvp_responses table** - Created missing table
2. ✅ **Session creation** - Fixed session_speakers INSERT
3. ✅ **Seat generation** - Removed schema conflicts
4. ✅ **QR check-in** - Fixed duplicate scan prevention
5. ✅ **Event card clicks** - Only buttons clickable now
6. ✅ **Subscription settings** - Added to user settings

## 🔍 Complete Functionality Test Guide

### 1. Authentication & User Management

#### Login/Registration
- [ ] Go to `http://localhost:3001/auth/login`
- [ ] Login with: `fiserv@gmail.com` / `password123` (SUPER_ADMIN)
- [ ] Should redirect to dashboard
- [ ] Logout and try registering new user

#### User Management (SUPER_ADMIN only)
- [ ] Go to `/admin/users`
- [ ] Click "+Add User" button
- [ ] Create new user with role
- [ ] Edit user role
- [ ] Delete user
- [ ] Verify only SUPER_ADMIN sees these options

**Expected**: All CRUD operations work without errors

---

### 2. Event Management

#### Create Event
- [ ] Go to `/events/create`
- [ ] Fill Basic Info (name, description, dates, capacity)
- [ ] Add Media (banner, images)
- [ ] Set Pricing (ticket types, prices)
- [ ] Add Legal info (terms, privacy)
- [ ] Review and Publish
- [ ] Event should appear in dashboard

**Expected**: Event created successfully, status = LIVE

#### View Events
- [ ] Go to `/dashboard` or `/admin/events`
- [ ] See list of all events
- [ ] Click on event to view details
- [ ] Edit event details
- [ ] Change event status (DRAFT, LIVE, COMPLETED)

**Expected**: All events visible, editable

#### Create Session
- [ ] Go to event → Sessions tab
- [ ] Click "Add Session"
- [ ] Fill: Title, Start/End time, Room, Track
- [ ] Add speakers (optional)
- [ ] Click Save

**Expected**: ✅ Session created successfully (FIXED TODAY)

---

### 3. Floor Plan & Seating

#### Generate Floor Plan
- [ ] Go to event → Design → Floor Plan
- [ ] Fill: Rows, Columns, Seat Prefix, Base Price
- [ ] Click "Generate Floor Plan"
- [ ] Verify seats created

**Expected**: ✅ Seats generated successfully (FIXED TODAY)

#### Seat Selection (User Side)
- [ ] Go to `/events/browse`
- [ ] Click "Register" on any event
- [ ] Should see seat selection page
- [ ] Select seats from floor plan
- [ ] Proceed to payment

**Expected**: Interactive seat selection works

---

### 4. Registration & Payment

#### Event Registration
- [ ] Go to `/events/browse`
- [ ] Click "Register" on event
- [ ] Select seats (if available)
- [ ] Fill registration form:
  - First Name, Last Name, Email
  - Phone, Company, Job Title
  - Dietary restrictions
- [ ] Apply promo code (optional)
- [ ] Complete payment (dummy payment)

**Expected**: Registration successful, QR code generated

#### View My Tickets
- [ ] Go to `/tickets` or user menu → My Tickets
- [ ] See all registered events
- [ ] View QR code for each ticket
- [ ] Download ticket

**Expected**: All registrations visible with QR codes

---

### 5. Check-in System

#### QR Code Check-in
- [ ] Go to event → Event Day → Check-in
- [ ] Click "Scan QR Code"
- [ ] Scan registration QR code
- [ ] First scan: Should check in successfully
- [ ] Second scan: Should show "Already checked in"

**Expected**: ✅ Check-in works, duplicate prevented (FIXED TODAY)

#### Manual Check-in
- [ ] Go to event → Event Day → Check-in
- [ ] Click "Manual Entry"
- [ ] Enter email or name
- [ ] Find registration
- [ ] Click "Check In"

**Expected**: Manual check-in works

---

### 6. RSVP Management

#### Send RSVP Invitations
- [ ] Go to event → RSVP → Guests
- [ ] Add guest emails
- [ ] Click "Send Invitations"
- [ ] Check email for RSVP link

**Expected**: ✅ RSVP invitations sent (TABLE FIXED TODAY)

#### Respond to RSVP
- [ ] Open RSVP email
- [ ] Click RSVP link
- [ ] Select: Going / Maybe / Not Going
- [ ] Submit response

**Expected**: ✅ Response recorded (TABLE FIXED TODAY)

#### View RSVP Responses
- [ ] Go to event → RSVP → Responses
- [ ] See list of all invitees
- [ ] See response status for each
- [ ] Filter by response type

**Expected**: ✅ All responses visible (TABLE FIXED TODAY)

---

### 7. Team Management

#### Add Team Members
- [ ] Go to event → Team
- [ ] Click "Invite Member"
- [ ] Select user from company
- [ ] Assign role (Organizer, Staff, etc.)
- [ ] Send invitation

**Expected**: Team member added, invitation sent

#### View Team
- [ ] Go to event → Team
- [ ] See all team members
- [ ] Edit member roles
- [ ] Remove members

**Expected**: Team management works

---

### 8. Analytics & Reports

#### Event Analytics
- [ ] Go to event → Analytics
- [ ] View registration trends
- [ ] See revenue charts
- [ ] Check attendance stats
- [ ] Export reports

**Expected**: ✅ Analytics load without errors (TABLE FIXED TODAY)

#### Dashboard Analytics
- [ ] Go to `/dashboard`
- [ ] See total events, registrations, revenue
- [ ] View recent activity
- [ ] Check event performance

**Expected**: Dashboard shows correct stats

---

### 9. Browse & Discovery (User Side)

#### Browse Events
- [ ] Go to `/events/browse`
- [ ] See all LIVE events
- [ ] Filter by city, category, price
- [ ] Search by name
- [ ] Use location detection

**Expected**: All filters work, events displayed

#### Event Details
- [ ] Click on any event card (NOT on buttons)
- [ ] Should NOT navigate (card not clickable)
- [ ] Click "Register" button
- [ ] Should navigate to registration

**Expected**: ✅ Only buttons clickable (FIXED TODAY)

#### I'm Interested
- [ ] Go to `/events/browse`
- [ ] Click "💙 I'm Interested" button
- [ ] Should show toast: "Interest Recorded!"
- [ ] Check organizer RSVP page
- [ ] Your email should appear in "Interested" list

**Expected**: ✅ Interest recorded in RSVP module (FIXED TODAY)

---

### 10. Settings

#### User Settings
- [ ] Go to `/settings`
- [ ] Update Profile (name, phone, company)
- [ ] Change Notifications preferences
- [ ] Update Privacy settings
- [ ] Click "Subscription" tab
- [ ] View current plan (Free)
- [ ] See upgrade options (Pro, Enterprise)

**Expected**: ✅ All settings tabs work, Subscription visible (FIXED TODAY)

#### Admin Settings
- [ ] Go to `/admin/settings`
- [ ] View system settings
- [ ] Check database status
- [ ] View email configuration
- [ ] Run quick actions (cache, backup)

**Expected**: All settings visible

---

### 11. Exhibitors & Sponsors

#### Manage Exhibitors
- [ ] Go to event → Exhibitors
- [ ] Click "Add Exhibitor"
- [ ] Fill company details
- [ ] Assign booth number
- [ ] Save exhibitor

**Expected**: Exhibitor created successfully

#### Exhibitor Registration (Public)
- [ ] Go to `/events/[id]/exhibitor-registration`
- [ ] Fill company details
- [ ] Select booth preferences
- [ ] Submit registration

**Expected**: Exhibitor registration successful

---

### 12. Promo Codes

#### Create Promo Code
- [ ] Go to event → Promo Codes
- [ ] Click "Create Promo Code"
- [ ] Set code, discount, usage limit
- [ ] Save promo code

**Expected**: Promo code created

#### Apply Promo Code
- [ ] During registration
- [ ] Enter promo code
- [ ] Click "Apply"
- [ ] Discount should be applied

**Expected**: Discount applied to total

---

### 13. Notifications

#### View Notifications
- [ ] Click bell icon in header
- [ ] See list of notifications
- [ ] Mark as read
- [ ] View notification details

**Expected**: Notifications displayed

#### Email Notifications
- [ ] Check email after:
  - Event registration
  - Team invitation
  - RSVP invitation
  - Check-in confirmation

**Expected**: Emails received

---

## 🐛 Known Issues (If Any)

### Currently Working
- ✅ Session creation
- ✅ Seat generation
- ✅ QR check-in
- ✅ Event card interactions
- ✅ RSVP responses
- ✅ Subscription settings

### To Monitor
- [ ] Payment gateway integration (dummy payment only)
- [ ] Email delivery (check SMTP configuration)
- [ ] File uploads (banners, images)
- [ ] Export functionality (CSV, PDF)

---

## 🔧 Quick Fixes Reference

### If Session Creation Fails
```sql
-- Check session_speakers table
\d session_speakers
-- Should only have: session_id, speaker_id
```

### If Seat Generation Fails
```sql
-- Check floor_plan_configs table
\d floor_plan_configs
-- Should have: tenant_id (not created_by)
```

### If RSVP Fails
```sql
-- Check rsvp_responses table exists
SELECT COUNT(*) FROM rsvp_responses;
```

### If Check-in Fails
```sql
-- Check registrations table
SELECT id, check_in_status, data_json FROM registrations WHERE event_id = 12;
```

---

## 📊 Database Health Check

Run these queries to verify database state:

```sql
-- Check all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check recent registrations
SELECT id, event_id, check_in_status, created_at FROM registrations ORDER BY created_at DESC LIMIT 10;

-- Check recent sessions
SELECT id, event_id, title, tenant_id, created_at FROM sessions ORDER BY created_at DESC LIMIT 10;

-- Check seat inventory
SELECT event_id, COUNT(*) as seat_count FROM seat_inventory GROUP BY event_id;

-- Check RSVP responses
SELECT event_id, response, COUNT(*) FROM rsvp_responses GROUP BY event_id, response;
```

---

## 🚀 Services Status

Check all services are running:
```bash
docker compose ps
```

**Expected**:
- ✅ postgres: Up (healthy)
- ✅ redis: Up (healthy)
- ✅ api: Up
- ✅ web: Up

---

## 📝 Testing Priority

### High Priority (Core Features)
1. ✅ Event Creation
2. ✅ Event Registration
3. ✅ Seat Selection
4. ✅ QR Check-in
5. ✅ Session Creation

### Medium Priority
6. ✅ RSVP Management
7. ✅ Team Management
8. ✅ Analytics
9. ✅ Browse Events

### Low Priority
10. ✅ Exhibitors
11. ✅ Promo Codes
12. ✅ Settings

---

## ✅ Summary

**All major functionality should now be working!**

If you encounter any errors:
1. Check the error message in browser console
2. Check Docker logs: `docker compose logs web --tail 100`
3. Verify database tables exist
4. Restart services if needed: `docker compose restart`

**Test the high-priority features first, then move to medium and low priority.**
