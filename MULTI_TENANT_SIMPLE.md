# 🏢 MULTI-TENANT - HOW IT WORKS

## CONCEPT
Multiple companies share one app, but data is isolated.

## FLOW (TOP TO BOTTOM)

1. **User Logs In** → Session stores `tenant_id: "tenant-a"`
2. **Middleware** → Adds header `x-tenant-id: tenant-a` to every request
3. **API Called** → `fetch('/api/events')`
4. **Prisma Middleware** → Auto-adds `WHERE tenant_id = 'tenant-a'`
5. **Database** → Returns only Company A's data

## KEY FILES

```typescript
// 1. Session (apps/web/lib/auth.ts)
session.user.currentTenantId = "tenant-a"

// 2. Middleware (apps/web/middleware.ts)
response.headers.set('x-tenant-id', token.currentTenantId)

// 3. Prisma Middleware (apps/web/lib/prisma-tenant-middleware.ts)
params.args.where.tenant_id = tenantId

// 4. Database
SELECT * FROM events WHERE tenant_id = 'tenant-a'
```

## EXAMPLE

**Company A User:**
- Sees: Event1, Event2 (tenant-a)
- Cannot see: Event3 (tenant-b) ❌

**Company B User:**
- Sees: Event3 (tenant-b)
- Cannot see: Event1, Event2 (tenant-a) ❌

## PROTECTION

✅ 82 APIs auto-filtered
✅ 40+ tables with tenant_id
✅ Automatic isolation
✅ No manual filtering needed
