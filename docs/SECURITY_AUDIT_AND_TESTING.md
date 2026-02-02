# 🔒 Security Audit & Testing Plan

## 📊 CURRENT ARCHITECTURE

### API Structure:
- **Next.js API Routes** → Proxy to → **Java Spring Boot API**
- Tenant filtering must happen on **Java side**
- Next.js middleware handles authentication & authorization
- Next.js provides tenant context via headers

---

## 🎯 SECURITY IMPLEMENTATION STATUS

### ✅ COMPLETED (Next.js Layer):

**1. Middleware** ✅
- Authentication required
- Tenant identification
- Permission checks
- Module-level access control

**2. Tenant Context** ✅
- Extracted from subdomain/path/session
- Added to request headers:
  - `x-tenant-slug`
  - `x-tenant-id`

**3. Permission System** ✅
- Role-based access control
- Permission guards available
- Client-side hooks

**4. Tenant Management** ✅
- Tenant creation
- Tenant switching
- User assignment

### ⚠️ NEEDS IMPLEMENTATION (Java API Layer):

**Critical**: Java API must filter by tenantId!

The Java API receives tenant context via headers but needs to:
1. Read `x-tenant-id` header
2. Filter all queries by `tenantId`
3. Validate user has access to tenant
4. Return 403 if tenant mismatch

---

## 🔴 CRITICAL SECURITY GAPS

### Gap 1: Java API Tenant Filtering
**Status**: ⚠️ NOT IMPLEMENTED

**Problem**:
- Java API doesn't filter by tenantId
- Users can access other tenants' data via API

**Solution**:
```java
// Add to Java controllers
@GetMapping("/events")
public List<Event> getEvents(
    @RequestHeader("x-tenant-id") String tenantId
) {
    // Filter by tenantId
    return eventRepository.findByTenantId(tenantId);
}
```

**Files to Update**:
- All Java controllers
- All repository queries
- Add tenant validation

### Gap 2: Direct Database Access
**Status**: ⚠️ VULNERABLE

**Problem**:
- If Java API is bypassed, no tenant filtering

**Solution**:
- Add database-level Row-Level Security (RLS)
- Or ensure all access goes through Java API
- Add API gateway

### Gap 3: Super Admin Bypass
**Status**: ⚠️ NEEDS TESTING

**Problem**:
- Super admin should see all tenants
- But Java API might not know about super admin

**Solution**:
- Pass user role in header
- Java API checks if SUPER_ADMIN
- Skip tenant filter for super admins

---

## 🧪 TESTING PLAN

### Phase 1: Tenant Isolation Tests

**Test 1.1: Create Multiple Tenants**
```bash
# Create Tenant A
curl -X POST http://localhost:3001/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"Tenant A","slug":"tenant-a","subdomain":"tenant-a"}'

# Create Tenant B
curl -X POST http://localhost:3001/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"Tenant B","slug":"tenant-b","subdomain":"tenant-b"}'
```

**Test 1.2: Create Events in Each Tenant**
```bash
# Login as User A (Tenant A)
# Create Event in Tenant A

# Login as User B (Tenant B)
# Create Event in Tenant B
```

**Test 1.3: Verify Data Isolation**
```sql
-- Check events in database
SELECT id, title, "tenantId" FROM "Event";

-- Should see:
-- event-1 | Event A | tenant-a
-- event-2 | Event B | tenant-b
```

**Test 1.4: API Isolation Test**
```bash
# Login as User A
# Call GET /api/events
# Should ONLY see Event A

# Login as User B
# Call GET /api/events
# Should ONLY see Event B
```

**Expected Result**: ✅ Each user sees only their tenant's data

**Current Result**: ❌ FAILS (Java API doesn't filter)

---

### Phase 2: Permission Tests

**Test 2.1: Role-Based Access**
```bash
# Login as EVENT_MANAGER
# Try to access /settings
# Expected: Redirected to /unauthorized
```

**Test 2.2: Sidebar Visibility**
```bash
# Login as SUPPORT_STAFF
# Check sidebar
# Expected: Only see Dashboard, Events, Registrations, Event Day
```

**Test 2.3: API Permission Test**
```bash
# Login as VIEWER
# Try to POST /api/events
# Expected: 403 Forbidden
```

---

### Phase 3: Super Admin Tests

**Test 3.1: Platform Access**
```bash
# Login as SUPER_ADMIN
# Access /super-admin
# Expected: Success
```

**Test 3.2: All Tenants Visibility**
```bash
# Login as SUPER_ADMIN
# Call GET /api/events
# Expected: See events from ALL tenants
```

**Test 3.3: Tenant Switching**
```bash
# Login as SUPER_ADMIN
# Switch to Tenant A
# See Tenant A's data
# Switch to Tenant B
# See Tenant B's data
```

---

### Phase 4: Security Penetration Tests

**Test 4.1: Direct API Access**
```bash
# Try to access API without authentication
curl http://localhost:3001/api/events
# Expected: 401 Unauthorized
```

**Test 4.2: Tenant ID Manipulation**
```bash
# Login as User A (Tenant A)
# Try to access Tenant B's data by changing headers
curl http://localhost:3001/api/events \
  -H "x-tenant-id: tenant-b"
# Expected: 403 Forbidden or empty data
```

**Test 4.3: SQL Injection**
```bash
# Try SQL injection in tenant slug
curl http://localhost:3001/api/tenants/check-slug?slug=test';DROP TABLE users;--
# Expected: Sanitized, no SQL execution
```

**Test 4.4: XSS Attack**
```bash
# Try XSS in tenant name
POST /api/tenants
{
  "name": "<script>alert('xss')</script>",
  "slug": "test"
}
# Expected: Sanitized, no script execution
```

---

## 🔧 FIXES REQUIRED

### Priority 1: Java API Tenant Filtering (CRITICAL)

**File**: Java controllers (all)

**Changes Needed**:
```java
// 1. Add tenant filter to all queries
@GetMapping("/events")
public List<Event> getEvents(
    @RequestHeader("x-tenant-id") String tenantId,
    @RequestHeader(value = "x-user-role", required = false) String userRole
) {
    // Super admin sees all
    if ("SUPER_ADMIN".equals(userRole)) {
        return eventRepository.findAll();
    }
    
    // Regular users see only their tenant
    return eventRepository.findByTenantId(tenantId);
}

// 2. Add tenant validation
@PostMapping("/events")
public Event createEvent(
    @RequestHeader("x-tenant-id") String tenantId,
    @RequestBody Event event
) {
    // Set tenantId from header
    event.setTenantId(tenantId);
    return eventRepository.save(event);
}

// 3. Add tenant check on update/delete
@PutMapping("/events/{id}")
public Event updateEvent(
    @RequestHeader("x-tenant-id") String tenantId,
    @PathVariable String id,
    @RequestBody Event event
) {
    Event existing = eventRepository.findById(id)
        .orElseThrow(() -> new NotFoundException());
    
    // Verify tenant ownership
    if (!existing.getTenantId().equals(tenantId)) {
        throw new ForbiddenException("Access denied");
    }
    
    event.setTenantId(tenantId);
    return eventRepository.save(event);
}
```

### Priority 2: Add Tenant Context to Headers

**File**: `middleware.ts` (already done ✅)

Headers added:
- `x-tenant-id`
- `x-tenant-slug`

**Need to add**:
- `x-user-role` (for super admin detection)

### Priority 3: Database Row-Level Security

**File**: PostgreSQL migration

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Registration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Exhibitor" ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation ON "Event"
  USING ("tenantId" = current_setting('app.current_tenant_id', true));

-- Set tenant context in connection
SET app.current_tenant_id = 'tenant-a';
```

---

## 📋 TESTING CHECKLIST

### Middleware Tests:
- [ ] Unauthenticated user → Redirected to /auth/signin
- [ ] User without tenant → Redirected to /select-tenant
- [ ] Super admin can access /super-admin
- [ ] Regular user blocked from /super-admin
- [ ] EVENT_MANAGER can access /events
- [ ] SUPPORT_STAFF blocked from /settings

### Tenant Isolation Tests:
- [ ] Create 2 tenants with different data
- [ ] User A sees only Tenant A's events
- [ ] User B sees only Tenant B's events
- [ ] Super admin sees all events
- [ ] Switching tenants changes visible data

### Permission Tests:
- [ ] Each role sees correct sidebar items
- [ ] Permission guards block unauthorized pages
- [ ] API returns 403 for unauthorized actions
- [ ] Buttons hidden based on permissions

### Security Tests:
- [ ] Cannot access API without auth
- [ ] Cannot manipulate tenant ID in headers
- [ ] SQL injection prevented
- [ ] XSS attacks sanitized
- [ ] CSRF protection enabled

---

## 🎯 PRODUCTION READINESS

### Current Status: 🟡 70% Ready

**Completed**:
- ✅ Next.js middleware security
- ✅ Authentication & authorization
- ✅ Tenant management
- ✅ Permission system
- ✅ Role-based UI

**Remaining**:
- ❌ Java API tenant filtering (CRITICAL)
- ❌ Database RLS
- ❌ Security testing
- ❌ Penetration testing

### Deployment Blockers:

1. **CRITICAL**: Java API must filter by tenantId
2. **HIGH**: Security testing must pass
3. **MEDIUM**: Add rate limiting
4. **MEDIUM**: Add audit logging

---

## 🚀 IMMEDIATE ACTION ITEMS

### This Week:
1. ✅ ~~Next.js middleware~~ - DONE
2. ✅ ~~Permission guards~~ - DONE
3. ✅ ~~Tenant management~~ - DONE
4. ❌ **Update Java API with tenant filtering** - CRITICAL
5. ❌ **Test tenant isolation** - CRITICAL
6. ❌ **Security audit** - HIGH

### Next Week:
7. Add database RLS
8. Implement rate limiting
9. Add audit logging
10. Penetration testing

---

## 📝 SUMMARY

**Next.js Layer**: ✅ 100% Secure
- Middleware blocks unauthorized access
- Permission system enforced
- Tenant context provided

**Java API Layer**: ❌ 0% Secure
- No tenant filtering
- Data leakage risk
- CRITICAL VULNERABILITY

**Overall Security**: 🔴 NOT PRODUCTION READY

**Next Step**: Update Java API to filter by tenantId

---

**DO NOT DEPLOY TO PRODUCTION until Java API is secured!** 🚨
