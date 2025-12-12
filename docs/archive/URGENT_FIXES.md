# Urgent Fixes Required

## 1. Remove Background Gradient ✅ DONE
File: `/apps/web/app/globals.css` line 76
Changed to: `background-color: #f8f9fa;`

## 2. Fix Event Deletion (403 Error)
File: `/apps/web/app/api/events/[id]/route.ts` line 20
Change: `if (role !== 'SUPER_ADMIN')` to `if (role !== 'SUPER_ADMIN' && role !== 'ADMIN')`

## 3. Add Exhibitors Tab
File: `/apps/web/components/events/ManageTabs.tsx` line 14
Add after Sponsors: `{ href: \`${base}/exhibitors\`, label: 'Exhibitors' },`

## 4. Fix User Preferences Error
File: `/apps/web/app/api/user/preferences/route.ts`
The error is likely due to missing `user_preferences` table or BigInt conversion.
Add try-catch around line 16-19 to handle missing user gracefully.

## 5. Create Recent Activity API
Create file: `/apps/web/app/api/activities/route.ts`
```typescript
import prisma from '@/lib/prisma'
export async function GET() {
  const events = await prisma.$queryRaw`SELECT name, created_at FROM events ORDER BY created_at DESC LIMIT 10`
  const regs = await prisma.$queryRaw`SELECT r.email, e.name, (SELECT COUNT(*) FROM seat_inventory WHERE event_id = e.id AND is_available = true) as seats FROM registrations r JOIN events e ON r.event_id = e.id ORDER BY r.created_at DESC LIMIT 10`
  return Response.json([...events, ...regs])
}
```

## 6. Update Event Card - Move Price & Add Urgency
Find event card component in `/apps/web/app/explore/page.tsx`
Move price display next to eye icon
Add: `{seatsRemaining < 50 && <span className="text-red-600 font-semibold">Only {seatsRemaining} seats left! Hurry up! ⚡</span>}`

## 7. Update Exhibitors Page
File: `/apps/web/app/events/[id]/exhibitors/page.tsx`
Add form fields:
- Booth Size: dropdown (Standard, Large, Small)
- Booth Setup: dropdown (Corner, Endcap, Inline)
- Additional Requirements: textarea

Run: `docker compose restart web` after changes
