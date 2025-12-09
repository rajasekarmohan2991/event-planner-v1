# Quick Tenant Filter Implementation Guide

## Files Updated (4/80):
✅ /api/events/route.ts - Registration counts
✅ /api/registrations/my/route.ts - User registrations  
✅ /api/events/[id]/payments/route.ts - Payments
✅ /api/events/[id]/promo-codes/route.ts - Promo codes

## Priority Files to Update (Next 10):

1. /api/events/[id]/registrations/route.ts
   - Line 31: Add tenant_id to whereConditions
   - Line 259: Add tenant_id to INSERT

2. /api/events/[id]/speakers/route.ts
   - Add: WHERE tenant_id = ${tenantId}

3. /api/events/[id]/sponsors/route.ts
   - Add: WHERE tenant_id = ${tenantId}

4. /api/events/[id]/sessions/route.ts
   - Add: WHERE tenant_id = ${tenantId}

5. /api/events/[id]/rsvp-interest/route.ts
   - Add: WHERE tenant_id = ${tenantId}

6. /api/events/[id]/rsvp-interests/list/route.ts
   - Add: WHERE tenant_id = ${tenantId}

7. /api/events/[id]/approvals/registrations/route.ts
   - Add: WHERE tenant_id = ${tenantId}

8. /api/events/[id]/registrations/cancellation-approvals/route.ts
   - Add: WHERE tenant_id = ${tenantId}

9. /api/tickets/route.ts
   - Add: WHERE tenant_id = ${tenantId}

10. /api/locations/route.ts
    - Add: WHERE tenant_id = ${tenantId}

## Pattern:
```typescript
import { getTenantId } from '@/lib/tenant-context'
const tenantId = getTenantId()
// Add: AND tenant_id = ${tenantId}
```

## Status: 4/80 complete (5%)
## Estimated: 20-25 hours remaining
