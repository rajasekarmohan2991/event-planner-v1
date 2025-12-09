# 👥 CURRENT USERS & CREDENTIALS

## Database: event_planner

---

## 📋 USER LIST

### User 1: Admin User
- **ID**: 1
- **Name**: Admin
- **Email**: `admin@eventplanner.com`
- **Password**: `admin123` (hashed in DB)
- **System Role**: `ADMIN`
- **Current Tenant**: `default-tenant`
- **Tenant Role**: `OWNER`
- **Tenant Name**: Default Organization

**Access Level**:
- ✅ Can access admin routes
- ✅ Owner of default tenant
- ✅ Full access to default tenant's data
- ❌ Cannot access super admin routes
- ❌ Cannot see other tenants' data

---

### User 2: Super Admin
- **ID**: 2
- **Name**: Rajasekar Mohan
- **Email**: `rbusiness2111@gmail.com`
- **Password**: OAuth/Google Sign-in (no password)
- **System Role**: `SUPER_ADMIN`
- **Current Tenant**: `default-tenant`
- **Tenant Role**: `TENANT_ADMIN`
- **Tenant Name**: Default Organization

**Access Level**:
- ✅ Can access ALL routes including `/super-admin`
- ✅ Can see ALL tenants' data
- ✅ Can manage all organizations
- ✅ Bypasses tenant filtering
- ✅ Platform-wide administrator

---

## 🔐 LOGIN CREDENTIALS

### For Testing:

**Admin User**:
```
Email: admin@eventplanner.com
Password: admin123
```

**Super Admin**:
```
Email: rbusiness2111@gmail.com
Method: Google OAuth (Sign in with Google)
```

---

## 🏢 TENANT INFORMATION

### Default Tenant:
- **ID**: `default-tenant`
- **Name**: Default Organization
- **Slug**: `default-tenant`
- **Members**: 2 users
  - Admin (OWNER)
  - Rajasekar Mohan (TENANT_ADMIN)

---

## 🎭 ROLE HIERARCHY

### System Roles:
1. **SUPER_ADMIN** (Rajasekar Mohan)
   - Platform-wide access
   - Can see all tenants
   - Bypasses all restrictions

2. **ADMIN** (Admin User)
   - Application admin
   - Tenant-scoped access
   - Cannot see other tenants

3. **USER** (Default for new signups)
   - Regular user
   - Tenant-scoped access

### Tenant Roles (within an organization):
1. **OWNER** (Admin User in default-tenant)
   - Full control of tenant
   - Can manage all settings
   - Can invite/remove users

2. **TENANT_ADMIN** (Rajasekar Mohan in default-tenant)
   - Administrative access
   - Can manage most settings
   - Cannot delete tenant

3. **EVENT_MANAGER** (Not assigned yet)
4. **MARKETING_MANAGER** (Not assigned yet)
5. **FINANCE_MANAGER** (Not assigned yet)
6. **SUPPORT_STAFF** (Not assigned yet)
7. **CONTENT_CREATOR** (Not assigned yet)
8. **ANALYST** (Not assigned yet)
9. **VIEWER** (Not assigned yet)

---

## 🧪 TESTING SCENARIOS

### Test 1: Admin User Login
```bash
1. Go to http://localhost:3001/auth/signin
2. Enter: admin@eventplanner.com / admin123
3. Should redirect to /dashboard
4. Should see "Default Organization" data only
5. Should NOT see /super-admin in sidebar
```

### Test 2: Super Admin Login
```bash
1. Go to http://localhost:3001/auth/signin
2. Click "Sign in with Google"
3. Use: rbusiness2111@gmail.com
4. Should redirect to /dashboard
5. Should see "Platform" section in sidebar
6. Can access /super-admin
7. Can see ALL tenants' data
```

### Test 3: Create New User
```bash
1. Go to http://localhost:3001/auth/signup
2. Sign up with new email
3. Should redirect to /create-tenant
4. Create new organization
5. Should be assigned as OWNER automatically
6. Should only see their own tenant's data
```

---

## 🔒 PASSWORD HASHES

**Note**: Passwords are hashed using bcrypt with 10 rounds.

- **Admin User**: `$2a$10$S.cmpR7W1QKKa0joABJ.bOCra.PgHzTIggOFqWjV4DAuErengalIi`
  - Plain text: `admin123`

- **Super Admin**: No password (OAuth only)

---

## 📊 DATABASE QUERIES

### Get All Users:
```sql
SELECT id, name, email, role, current_tenant_id 
FROM users 
ORDER BY id;
```

### Get User with Tenant Roles:
```sql
SELECT 
    u.id,
    u.name,
    u.email,
    u.role as system_role,
    tm.role as tenant_role,
    t.name as tenant_name,
    t.id as tenant_id
FROM users u
LEFT JOIN "TenantMember" tm ON u.id = tm."userId"
LEFT JOIN "Tenant" t ON tm."tenantId" = t.id
ORDER BY u.id;
```

### Get Tenant Members:
```sql
SELECT 
    tm.id,
    u.email,
    u.name,
    tm.role,
    t.name as tenant_name
FROM "TenantMember" tm
JOIN users u ON tm."userId" = u.id
JOIN "Tenant" t ON tm."tenantId" = t.id
WHERE tm."tenantId" = 'default-tenant';
```

---

## 🎯 QUICK ACCESS

### Admin Dashboard:
- URL: http://localhost:3001/dashboard
- Login: admin@eventplanner.com / admin123

### Super Admin Panel:
- URL: http://localhost:3001/super-admin
- Login: rbusiness2111@gmail.com (Google OAuth)

### Create New Tenant:
- URL: http://localhost:3001/create-tenant
- Requires: Any authenticated user

### Select Tenant:
- URL: http://localhost:3001/select-tenant
- Shows: All tenants user belongs to

---

## 🔄 PASSWORD RESET

If you need to reset the admin password:

```sql
-- Update password to 'newpassword123'
UPDATE users 
SET password_hash = '$2a$10$YourNewBcryptHashHere'
WHERE email = 'admin@eventplanner.com';
```

Or use the password reset flow:
1. Go to /auth/forgot-password
2. Enter email
3. Check email for reset link
4. Set new password

---

## ✅ VERIFICATION STATUS

- **Admin User**: Email verified ✅
- **Super Admin**: Email verified ✅ (via Google OAuth)

---

## 📝 NOTES

1. **Super Admin** (rbusiness2111@gmail.com) has platform-wide access and can see all tenants' data
2. **Admin** (admin@eventplanner.com) is scoped to default-tenant only
3. New users must create a tenant after signup
4. Users can belong to multiple tenants with different roles
5. System role (SUPER_ADMIN/ADMIN/USER) is separate from tenant role (OWNER/TENANT_ADMIN/etc.)

---

**Last Updated**: November 4, 2025
**Database**: event_planner (PostgreSQL)
**Environment**: Development (Docker)
