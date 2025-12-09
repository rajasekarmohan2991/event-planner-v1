# 👑 SUPER ADMIN Complete Guide - All Features & Settings

## 🎯 Quick Access Links

As a SUPER_ADMIN, here are all your admin features:

### 📊 Main Admin Dashboard
**URL**: http://localhost:3001/admin

**Features**:
- Total events count
- Upcoming events count
- Total users count
- Recent registrations count
- Total tickets sold
- Recent activities feed

---

### 👥 User Management (Role Management)
**URL**: http://localhost:3001/admin/users

**What You Can Do**:
- ✅ View all users in the system
- ✅ **Edit user roles** (NEW!)
- ✅ Change any user to: SUPER_ADMIN, ADMIN, EVENT_MANAGER, or USER
- ✅ See color-coded role badges
- ✅ View user creation dates

**How to Change Roles**:
1. Go to http://localhost:3001/admin/users
2. Find the user you want to modify
3. Click **"Edit Role"** button
4. Select new role from modal
5. Click **"Save Changes"**
6. ✅ Done! Role updated instantly

---

### ✅ Verifications
**URL**: http://localhost:3001/admin/verifications

**Purpose**: Manage user verifications and approvals

---

## 🎨 Admin Layout & Navigation

Your admin panel has a sidebar with:
- 📊 Dashboard
- 👥 Users
- ✅ Verifications
- (More sections as needed)

---

## 🔐 Role Management Details

### Available Roles

#### 🟣 SUPER_ADMIN (Your Role)
**Full System Access**:
- ✅ Access ALL features
- ✅ View ALL tenants' data
- ✅ Manage ALL users
- ✅ Assign ANY role (including SUPER_ADMIN)
- ✅ Delete any event
- ✅ Override all restrictions
- ✅ System-wide administration

**Where to Access**:
- Admin Dashboard: http://localhost:3001/admin
- User Management: http://localhost:3001/admin/users
- All event management features
- All tenant features

---

#### 🔵 ADMIN
**Tenant Admin Access**:
- ✅ Access admin dashboard
- ✅ Manage users in their tenant
- ✅ Create and manage events
- ✅ View reports and analytics
- ✅ Assign roles (except SUPER_ADMIN)
- ❌ Cannot see other tenants' data
- ❌ Cannot assign SUPER_ADMIN role

**Use Case**: Tenant administrators, organization admins

---

#### 🟢 EVENT_MANAGER
**Event Creation & Management**:
- ✅ Create events
- ✅ Manage their own events
- ✅ Add speakers and sponsors
- ✅ Manage team members
- ✅ View registrations
- ✅ Send communications
- ❌ No admin dashboard access
- ❌ Cannot manage other users

**Use Case**: Event organizers, coordinators

---

#### ⚪ USER
**Regular User Access**:
- ✅ View public events
- ✅ Register for events
- ✅ View their registrations
- ❌ Cannot create events
- ❌ No admin access
- ❌ No management features

**Use Case**: Event attendees, regular users

---

## 📋 How to Manage Roles & Privileges

### Method 1: Admin UI (Recommended) ✅

**Step-by-Step**:

1. **Login as SUPER_ADMIN**
   ```
   Email: rbusiness2111@gmail.com
   Password: (your password)
   ```

2. **Navigate to User Management**
   ```
   URL: http://localhost:3001/admin/users
   ```

3. **View All Users**
   - You'll see a table with all users
   - Color-coded role badges
   - User details (ID, Name, Email, Role, Created Date)

4. **Edit User Role**
   - Click **"Edit Role"** button next to any user
   - Modal opens with role selection

5. **Select New Role**
   - Choose from 4 options:
     - 🟣 Super Admin (full access)
     - 🔵 Admin (tenant admin)
     - 🟢 Event Manager (create events)
     - ⚪ User (regular access)
   - Each option shows description

6. **Save Changes**
   - Click **"Save Changes"**
   - Success message appears
   - Role badge updates automatically
   - Modal closes

7. **Verify Change**
   - User's role badge should show new role
   - User will have new permissions immediately

---

### Method 2: Database Direct Access

If you prefer SQL:

```bash
# Connect to database
docker compose exec postgres psql -U postgres -d event_planner

# View all users and their roles
SELECT id, email, name, role, created_at 
FROM users 
ORDER BY id;

# Change a user's role
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'user@example.com';

# Verify the change
SELECT email, role FROM users WHERE email = 'user@example.com';

# Exit
\q
```

**Available Roles in Database**:
- `SUPER_ADMIN`
- `ADMIN`
- `EVENT_MANAGER`
- `USER`

---

## 🎯 Common Role Management Scenarios

### Scenario 1: Promote User to Event Manager
**When**: User wants to create and manage events

**Steps**:
1. Go to http://localhost:3001/admin/users
2. Find user (e.g., user@test.com)
3. Click "Edit Role"
4. Select "Event Manager"
5. Save
6. ✅ User can now create events!

---

### Scenario 2: Make Someone Admin
**When**: Need tenant administrator

**Steps**:
1. Go to http://localhost:3001/admin/users
2. Find user (e.g., manager@test.com)
3. Click "Edit Role"
4. Select "Admin"
5. Save
6. ✅ User can now access admin dashboard!

---

### Scenario 3: Create Another Super Admin
**When**: Need backup super admin

**Steps**:
1. Login as SUPER_ADMIN
2. Go to http://localhost:3001/admin/users
3. Find trusted user
4. Click "Edit Role"
5. Select "Super Admin"
6. Save
7. ✅ New SUPER_ADMIN created!

**⚠️ Note**: Only SUPER_ADMIN can assign SUPER_ADMIN role

---

### Scenario 4: Demote User
**When**: Remove elevated permissions

**Steps**:
1. Go to http://localhost:3001/admin/users
2. Find user with elevated role
3. Click "Edit Role"
4. Select "User"
5. Save
6. ✅ Permissions reduced to regular user!

---

## 📊 Permission Comparison Matrix

| Feature | SUPER_ADMIN | ADMIN | EVENT_MANAGER | USER |
|---------|-------------|-------|---------------|------|
| **Admin Dashboard** | ✅ | ✅ | ❌ | ❌ |
| **User Management** | ✅ | ✅ | ❌ | ❌ |
| **Assign SUPER_ADMIN** | ✅ | ❌ | ❌ | ❌ |
| **Assign Other Roles** | ✅ | ✅ | ❌ | ❌ |
| **Create Events** | ✅ | ✅ | ✅ | ❌ |
| **Delete Any Event** | ✅ | ✅ | Own Only | ❌ |
| **View All Tenants** | ✅ | ❌ | ❌ | ❌ |
| **Manage Speakers** | ✅ | ✅ | ✅ | ❌ |
| **Manage Sponsors** | ✅ | ✅ | ✅ | ❌ |
| **Team Management** | ✅ | ✅ | ✅ | ❌ |
| **Send Communications** | ✅ | ✅ | ✅ | ❌ |
| **View Reports** | ✅ | ✅ | ✅ | ❌ |
| **View Events** | ✅ | ✅ | ✅ | ✅ |
| **Register for Events** | ✅ | ✅ | ✅ | ✅ |

---

## 🔒 Security Features

### Role Assignment Protection
- ✅ Only authenticated users can access
- ✅ Only SUPER_ADMIN and ADMIN can change roles
- ✅ Only SUPER_ADMIN can assign SUPER_ADMIN role
- ✅ Role validation on backend
- ✅ Session-based authentication

### Audit Trail
- ✅ Role changes are logged
- ✅ Timestamps recorded
- ✅ User information tracked

---

## 🎨 UI Features

### User Management Page
**Features**:
- ✅ Sortable table
- ✅ Color-coded role badges:
  - Purple: SUPER_ADMIN
  - Blue: ADMIN
  - Green: EVENT_MANAGER
  - Gray: USER
- ✅ User count display
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling

### Edit Role Modal
**Features**:
- ✅ User information display
- ✅ Radio button role selection
- ✅ Role descriptions
- ✅ Visual feedback (highlighted selection)
- ✅ Save/Cancel buttons
- ✅ Loading state while saving
- ✅ Success/Error messages
- ✅ Auto-close on success

---

## 🚀 Quick Start Guide

### For First-Time Setup

1. **Login as SUPER_ADMIN**
   ```
   URL: http://localhost:3001/auth/login
   Email: rbusiness2111@gmail.com
   ```

2. **Access Admin Dashboard**
   ```
   URL: http://localhost:3001/admin
   ```

3. **View User Management**
   ```
   URL: http://localhost:3001/admin/users
   ```

4. **Test Role Change**
   - Find a test user
   - Click "Edit Role"
   - Change role
   - Save
   - Verify change

---

## 📝 Test Users Available

You have these test users already created:

```
Email                    | Role           | Password
-------------------------+----------------+-----------
rbusiness2111@gmail.com  | SUPER_ADMIN    | (your password)
admin@test.com           | ADMIN          | password123
manager@test.com         | EVENT_MANAGER  | password123
user@test.com            | USER           | password123
```

**Use these to test role-based access!**

---

## 🔧 Technical Implementation

### Frontend
- **File**: `apps/web/app/(admin)/admin/users/page.tsx`
- **Type**: Client component
- **Features**: 
  - React hooks for state management
  - Modal for role editing
  - Real-time updates
  - Error handling

### Backend API
- **Endpoint**: `PUT /api/admin/users/[id]/role`
- **File**: `apps/web/app/api/admin/users/[id]/role/route.ts`
- **Authentication**: Required
- **Authorization**: SUPER_ADMIN or ADMIN only
- **Validation**: Role validation, SUPER_ADMIN protection

### Database
- **Table**: `users`
- **Column**: `role` (VARCHAR)
- **Values**: SUPER_ADMIN, ADMIN, EVENT_MANAGER, USER

---

## 🎯 What's Already Implemented

### ✅ Completed Features

1. **Admin Dashboard**
   - Stats display
   - Recent activities
   - Responsive layout

2. **User Management UI**
   - User list table
   - Role badges
   - Edit role modal
   - Success/error feedback

3. **Role Management API**
   - PUT endpoint
   - Authentication check
   - Authorization check
   - Role validation
   - Database update

4. **Security**
   - Session-based auth
   - Role-based access control
   - SUPER_ADMIN protection
   - Input validation

5. **User Experience**
   - Loading states
   - Error messages
   - Success feedback
   - Auto-refresh
   - Responsive design

---

## 📍 Where Everything Is Located

### Admin Features Map

```
http://localhost:3001/
├── /admin                    → Admin Dashboard (stats, activities)
│   ├── /users                → User Management (role editing) ⭐ NEW!
│   └── /verifications        → User verifications
│
├── /dashboard                → Your main dashboard
│   └── Create Event button   → Only for EVENT_MANAGER+
│
├── /events                   → Events list
│   └── /[id]                 → Event details
│       ├── /info             → Event info (can delete)
│       ├── /team             → Team management
│       ├── /speakers         → Speakers CRUD
│       ├── /sponsors         → Sponsors CRUD
│       ├── /sessions         → Sessions CRUD
│       └── /registrations    → View registrations
│
└── /auth/login               → Login page
```

---

## 🎉 Summary

### What You Asked For:
> "as a super admin how to manage roles and privilege and i have implemented the admin setting with lookup already where is it"

### What I've Done:

1. ✅ **Enhanced your existing admin users page** with full role management
2. ✅ **Created role editing UI** with modal and role selection
3. ✅ **Implemented backend API** for role updates
4. ✅ **Added security checks** (only SUPER_ADMIN/ADMIN can change roles)
5. ✅ **Created comprehensive guide** (this document)

### Where It Is:
**http://localhost:3001/admin/users** ⭐

### How to Use:
1. Login as SUPER_ADMIN
2. Go to /admin/users
3. Click "Edit Role" on any user
4. Select new role
5. Save
6. Done! ✅

---

## 🚀 Ready to Use!

Your role management system is **fully functional** and ready to use right now!

**Test it**: http://localhost:3001/admin/users

**Need help?** Check browser console (F12) or refer to this guide!

---

## 📞 Quick Reference

### URLs
- Admin Dashboard: `/admin`
- User Management: `/admin/users` ⭐
- Verifications: `/admin/verifications`

### Roles
- SUPER_ADMIN (purple badge)
- ADMIN (blue badge)
- EVENT_MANAGER (green badge)
- USER (gray badge)

### Permissions
- SUPER_ADMIN: Everything
- ADMIN: Tenant admin
- EVENT_MANAGER: Create events
- USER: View only

**Everything is ready!** 🎉
