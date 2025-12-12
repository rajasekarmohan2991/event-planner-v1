# 🏢 COMPANY TENANT FLOW

## YOUR STRUCTURE

### 1. COMPANY REGISTERS
```
Company → /company/register
Creates:
- Tenant (slug: "acme-corp", subdomain: "acme-corp")
- Admin User (OWNER role)
- Plan: FREE (trial)
```

### 2. SUBSCRIBE TO PLAN
```
Admin → /settings/billing → Select Plan
Plans: FREE, STARTER, PRO, ENTERPRISE
Updates: tenant.plan, tenant.status = "ACTIVE"
```

### 3. CREATE EVENTS
```
Admin → /events/create
Event saved with: tenant_id = "acme-corp-id"
Only this company sees this event
```

### 4. INVITE TEAM MEMBERS
```
Admin → /team → Invite User
Roles:
- OWNER (full control)
- ADMIN (manage events, users)
- EVENT_MANAGER (create events)
- FINANCE_ADMIN (view payments)
- SUPPORT_STAFF (check-in)

Email sent → User accepts → Sets password → Active
```

### 5. SUBDOMAIN LOGIN

**Production:**
```
Main: https://eventplanner.com
Company A: https://acme-corp.eventplanner.com
Company B: https://techstart.eventplanner.com
```

**How it works:**
```typescript
// Middleware extracts subdomain
const subdomain = host.split('.')[0] // "acme-corp"
const tenant = await prisma.tenant.findUnique({ where: { subdomain }})
response.headers.set('x-tenant-id', tenant.id)
```

**Staff Login:**
```
1. Bob visits: acme-corp.eventplanner.com
2. Sees Acme Corp branded login
3. Logs in: bob@acme.com
4. System checks: Is Bob member of Acme Corp? ✅
5. Session: { tenantId: "acme-corp-id", role: "EVENT_MANAGER" }
6. Bob sees only Acme Corp data
```

## CURRENT STATUS

✅ Company registration working
✅ Tenant isolation (100%)
✅ Multi-user support ready
✅ Role-based permissions
⚠️ Subdomain: Works in code, needs DNS setup for production

## FILES

- Registration: `apps/web/app/company/register/page.tsx`
- Team Invite: `apps/web/app/(admin)/admin/team/page.tsx`
- Middleware: `apps/web/middleware.ts`
- Permissions: `apps/web/lib/permissions.ts`
