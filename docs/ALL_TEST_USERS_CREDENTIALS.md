# 🔐 ALL TEST USERS & CREDENTIALS

## 📋 COMPLETE USER LIST WITH LOGIN CREDENTIALS

### Password for ALL users: `password123`

---

## 👑 SUPER ADMIN

### User 1: Super Admin (Platform Administrator)
```
Name: Rajasekar Mohan
Email: rbusiness2111@gmail.com
Password: password123 (or Google OAuth)
System Role: SUPER_ADMIN
Tenant Role: TENANT_ADMIN
Login URL: http://localhost:3001/auth/signin
```

**Access**:
- ✅ Full platform access
- ✅ Can see ALL tenants
- ✅ Access to `/super-admin`
- ✅ Bypasses all tenant restrictions

---

## 👨‍💼 ADMIN

### User 2: Admin (Application Admin)
```
Name: Admin
Email: admin@eventplanner.com
Password: admin123
System Role: ADMIN
Tenant Role: OWNER
Login URL: http://localhost:3001/auth/signin
```

**Access**:
- ✅ Full access to Default Organization
- ✅ Can manage tenant settings
- ❌ Cannot see other tenants
- ❌ No super admin access

---

## 🏢 TENANT ROLES (All in Default Organization)

### User 3: Tenant Admin
```
Name: Tenant Admin
Email: tenantadmin@test.com
Password: password123
System Role: USER
Tenant Role: TENANT_ADMIN
```

**Permissions**:
- ✅ Events: Full access
- ✅ Registrations: Full access
- ✅ Payments: Full access
- ✅ Analytics: Full access
- ✅ Settings: Full access
- ✅ Team: Full access
- ✅ Marketing: Full access

---

### User 4: Event Manager
```
Name: Event Manager
Email: eventmanager@test.com
Password: password123
System Role: USER
Tenant Role: EVENT_MANAGER
```

**Permissions**:
- ✅ Events: Create, edit, delete
- ✅ Registrations: View, manage
- ✅ Attendees: Full access
- ✅ Check-in: Full access
- ✅ Sessions: Full access
- ✅ Speakers: Full access
- ❌ Settings: No access
- ❌ Payments: View only

---

### User 5: Marketing Manager
```
Name: Marketing Manager
Email: marketing@test.com
Password: password123
System Role: USER
Tenant Role: MARKETING_MANAGER
```

**Permissions**:
- ✅ Events: View, edit marketing content
- ✅ Campaigns: Full access
- ✅ Email: Full access
- ✅ Social: Full access
- ✅ Analytics: View marketing metrics
- ❌ Payments: No access
- ❌ Settings: Limited access

---

### User 6: Finance Manager
```
Name: Finance Manager
Email: finance@test.com
Password: password123
System Role: USER
Tenant Role: FINANCE_MANAGER
```

**Permissions**:
- ✅ Payments: Full access
- ✅ Invoices: Full access
- ✅ Refunds: Full access
- ✅ Financial reports: Full access
- ✅ Promo codes: Full access
- ✅ Pricing: Full access
- ❌ Event content: View only
- ❌ Marketing: No access

---

### User 7: Support Staff
```
Name: Support Staff
Email: support@test.com
Password: password123
System Role: USER
Tenant Role: SUPPORT_STAFF
```

**Permissions**:
- ✅ Registrations: View, manage
- ✅ Attendees: View, edit
- ✅ Check-in: Full access
- ✅ Support tickets: Full access
- ❌ Events: View only
- ❌ Payments: View only
- ❌ Settings: No access

---

### User 8: Content Creator
```
Name: Content Creator
Email: content@test.com
Password: password123
System Role: USER
Tenant Role: CONTENT_CREATOR
```

**Permissions**:
- ✅ Events: Edit content/description
- ✅ Sessions: Create, edit
- ✅ Speakers: Create, edit
- ✅ Sponsors: Create, edit
- ✅ Media: Upload, manage
- ❌ Event settings: No access
- ❌ Payments: No access
- ❌ Registrations: View only

---

### User 9: Analyst
```
Name: Analyst
Email: analyst@test.com
Password: password123
System Role: USER
Tenant Role: ANALYST
```

**Permissions**:
- ✅ Analytics: Full access
- ✅ Reports: Full access
- ✅ Dashboards: Full access
- ✅ Data export: Full access
- ❌ Events: View only
- ❌ Registrations: View only
- ❌ Settings: No access
- ❌ Payments: View only

---

### User 10: Viewer
```
Name: Viewer
Email: viewer@test.com
Password: password123
System Role: USER
Tenant Role: VIEWER
```

**Permissions**:
- ✅ Events: View only
- ✅ Registrations: View only
- ✅ Analytics: View only
- ❌ No edit access
- ❌ No delete access
- ❌ No create access
- ❌ No settings access

---

## 🧪 QUICK LOGIN GUIDE

### Step 1: Go to Login Page
```
http://localhost:3001/auth/signin
```

### Step 2: Choose a User
Pick any user from the list above

### Step 3: Enter Credentials
```
Email: [user email from above]
Password: password123
```
(Exception: admin@eventplanner.com uses `admin123`)

### Step 4: Click Sign In
You'll be redirected to the dashboard with role-specific access

---

## 📊 TESTING DIFFERENT ROLES

### Test Super Admin Access:
```bash
1. Login: rbusiness2111@gmail.com / password123
2. Should see "Platform" section in sidebar
3. Can access: /super-admin
4. Can see: ALL tenants' data
```

### Test Event Manager:
```bash
1. Login: eventmanager@test.com / password123
2. Should see: Events, Registrations, Attendees
3. Should NOT see: Settings, Super Admin
4. Can: Create/edit events
```

### Test Viewer (Read-Only):
```bash
1. Login: viewer@test.com / password123
2. Should see: All pages (read-only)
3. Should NOT see: Edit/Delete buttons
4. Cannot: Create or modify anything
```

### Test Finance Manager:
```bash
1. Login: finance@test.com / password123
2. Should see: Payments, Invoices, Reports
3. Can: Manage payments and refunds
4. Cannot: Edit event content
```

---

## 🔄 PASSWORD RESET

If you forget a password or need to reset:

### Option 1: Use SQL
```sql
-- Reset to 'password123'
UPDATE users 
SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE email = 'user@example.com';
```

### Option 2: Use Password Reset Flow
```
1. Go to: http://localhost:3001/auth/forgot-password
2. Enter email
3. Check email for reset link
4. Set new password
```

---

## 📋 QUICK REFERENCE TABLE

| Role | Email | Password | System Role | Tenant Role |
|------|-------|----------|-------------|-------------|
| Super Admin | rbusiness2111@gmail.com | password123 | SUPER_ADMIN | TENANT_ADMIN |
| Admin | admin@eventplanner.com | admin123 | ADMIN | OWNER |
| Tenant Admin | tenantadmin@test.com | password123 | USER | TENANT_ADMIN |
| Event Manager | eventmanager@test.com | password123 | USER | EVENT_MANAGER |
| Marketing | marketing@test.com | password123 | USER | MARKETING_MANAGER |
| Finance | finance@test.com | password123 | USER | FINANCE_MANAGER |
| Support | support@test.com | password123 | USER | SUPPORT_STAFF |
| Content | content@test.com | password123 | USER | CONTENT_CREATOR |
| Analyst | analyst@test.com | password123 | USER | ANALYST |
| Viewer | viewer@test.com | password123 | USER | VIEWER |

---

## 🎯 ROLE HIERARCHY

```
SUPER_ADMIN (Platform-wide)
    ↓
ADMIN (Application-wide)
    ↓
OWNER (Tenant-wide, full control)
    ↓
TENANT_ADMIN (Tenant-wide, admin access)
    ↓
EVENT_MANAGER (Event management)
MARKETING_MANAGER (Marketing & campaigns)
FINANCE_MANAGER (Payments & finance)
    ↓
SUPPORT_STAFF (Support & check-in)
CONTENT_CREATOR (Content editing)
ANALYST (Analytics & reports)
    ↓
VIEWER (Read-only access)
```

---

## 🔒 SECURITY NOTES

1. **All passwords are hashed** using bcrypt with 10 rounds
2. **Super Admin** can see all tenants' data (by design)
3. **Regular users** can only see their tenant's data
4. **Tenant roles** determine permissions within a tenant
5. **System roles** determine platform-level access

---

## 🐛 TROUBLESHOOTING LOGIN ISSUES

### Issue: "Invalid email or password"

**Solution 1**: Verify email is correct (check for typos)
```sql
SELECT email FROM users WHERE email LIKE '%test%';
```

**Solution 2**: Reset password using SQL
```bash
docker compose exec postgres psql -U postgres -d event_planner -c "UPDATE users SET password_hash = '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' WHERE email = 'eventmanager@test.com';"
```

**Solution 3**: Check if user exists
```sql
SELECT id, name, email, role FROM users;
```

### Issue: "User not found"

**Solution**: Run the setup script again
```bash
docker compose exec -T postgres psql -U postgres -d event_planner < setup-test-users.sql
```

---

## ✅ VERIFICATION

To verify all users are set up correctly:

```bash
docker compose exec postgres psql -U postgres -d event_planner -c "
SELECT 
    u.name,
    u.email,
    u.role as system_role,
    tm.role as tenant_role,
    CASE WHEN u.password_hash IS NOT NULL THEN 'Yes' ELSE 'No' END as has_password
FROM users u
LEFT JOIN \"TenantMember\" tm ON u.id = tm.\"userId\"
ORDER BY u.id;
"
```

---

**Last Updated**: November 4, 2025  
**Total Users**: 10  
**Default Password**: password123 (except admin: admin123)  
**Login URL**: http://localhost:3001/auth/signin
