# 🧪 MULTI-TENANT TESTING GUIDE - STEP BY STEP

## 📋 PRE-REQUISITES

✅ All services running:
```bash
docker compose ps
# Should show: web, api, postgres, redis all UP
```

✅ Application accessible:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:8081

---

## 🎯 TEST SUITE

### **TEST 1: Verify Default Tenant Exists**

```bash
# Check default tenant in database
docker compose exec -T postgres psql -U postgres -d event_planner -c "SELECT id, name, slug, status FROM tenants;"

# Expected output:
#       id        |     name      |     slug      | status
# ----------------+---------------+---------------+--------
#  default-tenant | Default Org   | default       | ACTIVE
```

---

### **TEST 2: Register New Company (Tenant)**

**Method 1: Using cURL**
```bash
curl -X POST http://localhost:3001/api/company/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "Acme Corporation",
    "companyEmail": "contact@acme.com",
    "phone": "+1234567890",
    "industry": "Technology",
    "country": "USA",
    "adminName": "John Doe",
    "adminEmail": "john@acme.com",
    "password": "Test123!@#"
  }'

# Expected response:
# {
#   "success": true,
#   "tenant": { "id": "...", "slug": "acme-corporation", ... },
#   "user": { "id": "...", "email": "john@acme.com", ... }
# }
```

**Method 2: Using Frontend**
1. Open: http://localhost:3001/company/register
2. Fill in the form:
   - Company Name: "Acme Corporation"
   - Company Email: "contact@acme.com"
   - Admin Name: "John Doe"
   - Admin Email: "john@acme.com"
   - Password: "Test123!@#"
3. Click "Register Company"
4. Should redirect to login page with success message

---

### **TEST 3: Verify New Tenant Created**

```bash
# Check tenants in database
docker compose exec -T postgres psql -U postgres -d event_planner -c "SELECT id, name, slug, subdomain, status, plan FROM tenants ORDER BY created_at;"

# Expected output: 2 tenants
#       id        |       name        |      slug       |    subdomain     | status | plan
# ----------------+-------------------+-----------------+------------------+--------+------
#  default-tenant | Default Org       | default         | default          | ACTIVE | FREE
#  acme-corp-123  | Acme Corporation  | acme-corporation| acme-corporation | TRIAL  | FREE
```

---

### **TEST 4: Verify Tenant Membership**

```bash
# Check tenant members
docker compose exec -T postgres psql -U postgres -d event_planner -c "SELECT tm.tenant_id, tm.role, u.email FROM tenant_members tm JOIN users u ON tm.user_id = u.id;"

# Expected output:
#   tenant_id    | role  |      email
# ---------------+-------+-----------------
#  acme-corp-123 | OWNER | john@acme.com
```

---

### **TEST 5: Test Tenant Isolation (Critical Test)**

**Step 1: Create Event as Default Tenant**
```bash
# Login as default tenant user and create event
# (Use your existing user or create one)

curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Default Tenant Event",
    "date": "2025-12-01",
    "location": "New York"
  }'
```

**Step 2: Login as Acme Corp User**
```bash
curl -X POST http://localhost:3001/api/company/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@acme.com",
    "password": "Test123!@#",
    "tenantSlug": "acme-corporation"
  }'

# Save the session cookie from response
```

**Step 3: Try to Access Default Tenant's Event**
```bash
# Query events as Acme Corp user
curl http://localhost:3001/api/events \
  -H "Cookie: acme-session-cookie"

# Expected: Should NOT see "Default Tenant Event"
# Should only see Acme Corp's events (empty if none created)
```

**Step 4: Create Event as Acme Corp**
```bash
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -H "Cookie: acme-session-cookie" \
  -d '{
    "name": "Acme Corp Event",
    "date": "2025-12-15",
    "location": "San Francisco"
  }'
```

**Step 5: Verify Isolation in Database**
```bash
# Check events with tenant_id
docker compose exec -T postgres psql -U postgres -d event_planner -c "SELECT id, name, tenant_id FROM events ORDER BY created_at;"

# Expected output:
#  id |        name           |   tenant_id
# ----+-----------------------+----------------
#   1 | Default Tenant Event  | default-tenant
#   2 | Acme Corp Event       | acme-corp-123
```

---

### **TEST 6: Test Prisma Middleware Auto-Filtering**

**Verify middleware is working:**
```bash
# Check Prisma client has middleware
grep -A 5 "prisma.\$use" apps/web/lib/prisma.ts

# Expected output:
# prisma.$use(createTenantMiddleware())
```

**Test auto-filtering:**
1. Login as Acme Corp user
2. Create a registration for Acme Corp event
3. Query registrations - should only see Acme Corp's
4. Try to query with different tenant - should get empty result

---

### **TEST 7: Test Tenant Switcher (Multi-Tenant User)**

**Step 1: Add User to Multiple Tenants**
```bash
# Add john@acme.com to default-tenant as well
docker compose exec -T postgres psql -U postgres -d event_planner -c "
INSERT INTO tenant_members (tenant_id, user_id, role, status, joined_at)
SELECT 'default-tenant', id, 'MEMBER', 'ACTIVE', NOW()
FROM users WHERE email = 'john@acme.com';
"
```

**Step 2: Test Tenant Switcher UI**
1. Login as john@acme.com
2. Add `<TenantSwitcher />` to your layout/header
3. Should see dropdown with 2 organizations:
   - Acme Corporation (OWNER)
   - Default Org (MEMBER)
4. Click to switch between them
5. Verify data changes based on selected tenant

---

### **TEST 8: Test Super Admin Panel**

**Step 1: Create Super Admin User**
```bash
# Update a user to SUPER_ADMIN role
docker compose exec -T postgres psql -U postgres -d event_planner -c "
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'admin@example.com';
"
```

**Step 2: Access Super Admin Dashboard**
1. Login as super admin user
2. Navigate to: http://localhost:3001/super-admin/tenants
3. Should see:
   - Stats: Total tenants, Active, Trial, Suspended
   - List of all tenants with member counts
   - Activate/Deactivate buttons

**Step 3: Test Activate/Deactivate**
```bash
# Deactivate Acme Corp
curl -X POST http://localhost:3001/api/super-admin/tenants/acme-corp-123/deactivate \
  -H "Cookie: super-admin-session-cookie"

# Verify status changed
docker compose exec -T postgres psql -U postgres -d event_planner -c "SELECT id, name, status FROM tenants WHERE id = 'acme-corp-123';"

# Expected: status = 'SUSPENDED'
```

---

### **TEST 9: Test Cross-Tenant Data Protection**

**Attempt to access another tenant's data:**
```bash
# Login as Acme Corp user
# Try to update Default Tenant's event

curl -X PUT http://localhost:3001/api/events/1 \
  -H "Content-Type: application/json" \
  -H "Cookie: acme-session-cookie" \
  -d '{"name": "Hacked Event"}'

# Expected: 404 Not Found or 403 Forbidden
# Middleware should filter out the event
```

---

### **TEST 10: Test Automatic tenant_id Injection**

**Create records and verify tenant_id is auto-added:**
```bash
# Create registration as Acme Corp
curl -X POST http://localhost:3001/api/events/2/registrations \
  -H "Content-Type: application/json" \
  -H "Cookie: acme-session-cookie" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com"
  }'

# Check database - tenant_id should be auto-added
docker compose exec -T postgres psql -U postgres -d event_planner -c "SELECT id, email, tenant_id FROM registrations ORDER BY created_at DESC LIMIT 1;"

# Expected:
#  id |       email        |   tenant_id
# ----+--------------------+----------------
#  10 | jane@example.com   | acme-corp-123
```

---

## ✅ SUCCESS CRITERIA

All tests should pass with these results:

1. ✅ Default tenant exists in database
2. ✅ New company registration creates tenant + user + membership
3. ✅ Tenant isolation works - users only see their tenant's data
4. ✅ Prisma middleware auto-adds tenant_id to queries
5. ✅ Prisma middleware auto-adds tenant_id to creates
6. ✅ Cross-tenant access is blocked
7. ✅ Tenant switcher allows switching between orgs
8. ✅ Super admin can see and manage all tenants
9. ✅ Activate/deactivate tenant works
10. ✅ No data leakage between tenants

---

## 🐛 TROUBLESHOOTING

### **Issue: Middleware not applying filters**
```bash
# Check middleware is loaded
grep "createTenantMiddleware" apps/web/lib/prisma.ts

# Restart web service
docker compose restart web
```

### **Issue: Tenant not found**
```bash
# Check tenant exists
docker compose exec -T postgres psql -U postgres -d event_planner -c "SELECT * FROM tenants;"

# Check tenant_members
docker compose exec -T postgres psql -U postgres -d event_planner -c "SELECT * FROM tenant_members;"
```

### **Issue: Session not persisting**
```bash
# Check session configuration in next-auth
# Verify cookies are being set
# Clear browser cache and cookies
```

---

## 📊 MONITORING

**Check tenant metrics:**
```bash
# Count events per tenant
docker compose exec -T postgres psql -U postgres -d event_planner -c "
SELECT tenant_id, COUNT(*) as event_count
FROM events
GROUP BY tenant_id;
"

# Count registrations per tenant
docker compose exec -T postgres psql -U postgres -d event_planner -c "
SELECT tenant_id, COUNT(*) as registration_count
FROM registrations
GROUP BY tenant_id;
"

# Count users per tenant
docker compose exec -T postgres psql -U postgres -d event_planner -c "
SELECT t.name, COUNT(tm.user_id) as member_count
FROM tenants t
LEFT JOIN tenant_members tm ON t.id = tm.tenant_id
GROUP BY t.id, t.name;
"
```

---

## 🎉 CONCLUSION

If all tests pass, your multi-tenant system is:
- ✅ Fully functional
- ✅ Secure (data isolated)
- ✅ Automatic (Prisma middleware)
- ✅ Production ready

**Happy multi-tenanting!** 🚀
