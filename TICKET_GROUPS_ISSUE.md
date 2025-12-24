# Ticket Groups Issue - Not Able to Add

## The Problem

When you click "+ Add Ticket Group", the groups are not persisting. They disappear on page refresh.

## Root Cause

**Ticket Groups are UI-only** - they're not connected to the database!

### Current Implementation:
- Groups stored in React state only (line 44-46 in ticket-class/page.tsx)
- Hardcoded default group: `{ id: 'g-1', name: 'vvip' }`
- Add Group modal creates groups with `crypto.randomUUID()` (line 703)
- **No API calls** to save groups to database
- **No database table** for ticket groups

### What Happens:
1. Click "+ Add Ticket Group"
2. Enter group name
3. Click Save
4. Group appears in UI ✅
5. Refresh page
6. Group disappears ❌ (only 'vvip' remains)

## The Fix Required

To make ticket groups work, we need:

### 1. Database Table (Prisma Schema)
```prisma
model TicketGroup {
  id        String   @id @default(cuid())
  eventId   BigInt   @map("event_id")
  tenantId  String?  @map("tenant_id")
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  event     Event?   @relation(fields: [eventId], references: [id])
  tenant    Tenant?  @relation(fields: [tenantId], references: [id])
  tickets   Ticket[] @relation("TicketGroupTickets")
  
  @@map("ticket_groups")
}

// Update Ticket model to add relation
model Ticket {
  // ... existing fields
  groupId   String?  @map("group_id")
  group     TicketGroup? @relation("TicketGroupTickets", fields: [groupId], references: [id])
}
```

### 2. Database Migration
```sql
CREATE TABLE ticket_groups (
  id VARCHAR(255) PRIMARY KEY,
  event_id BIGINT NOT NULL,
  tenant_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
);

-- Add group_id to tickets table
ALTER TABLE tickets ADD COLUMN group_id VARCHAR(255);
ALTER TABLE tickets ADD FOREIGN KEY (group_id) REFERENCES ticket_groups(id) ON DELETE SET NULL;

-- Create default group for existing events
INSERT INTO ticket_groups (id, event_id, tenant_id, name)
SELECT 
  'default-' || id::text,
  id,
  tenant_id,
  'General Admission'
FROM events;

-- Link existing tickets to default groups
UPDATE tickets t
SET group_id = 'default-' || event_id::text
WHERE group_id IS NULL;
```

### 3. API Endpoints

**Create:** `POST /api/events/[id]/ticket-groups`
```typescript
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { name } = await req.json()
  const eventId = BigInt(params.id)
  
  const group = await prisma.ticketGroup.create({
    data: {
      eventId,
      tenantId: event.tenantId,
      name
    }
  })
  
  return NextResponse.json(group)
}
```

**List:** `GET /api/events/[id]/ticket-groups`
```typescript
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = BigInt(params.id)
  
  const groups = await prisma.ticketGroup.findMany({
    where: { eventId },
    orderBy: { createdAt: 'asc' }
  })
  
  return NextResponse.json(groups)
}
```

**Delete:** `DELETE /api/events/[id]/ticket-groups/[groupId]`

### 4. Frontend Updates

Update `ticket-class/page.tsx`:

```typescript
// Load groups from API
useEffect(() => {
  const loadGroups = async () => {
    const res = await fetch(`/api/events/${params.id}/ticket-groups`)
    if (res.ok) {
      const data = await res.json()
      setGroups(data)
    }
  }
  loadGroups()
}, [params.id])

// Save group to API
const saveGroup = async () => {
  const name = groupNameInput.trim()
  if (!name) return
  
  const res = await fetch(`/api/events/${params.id}/ticket-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  })
  
  if (res.ok) {
    const newGroup = await res.json()
    setGroups(prev => [...prev, newGroup])
    setShowGroupModal(false)
  }
}
```

## Temporary Workaround

Until the full implementation is done, you can:

1. **Use the default 'vvip' group** - it's hardcoded and always available
2. **Edit the code** to add more hardcoded groups:
   ```typescript
   const [groups, setGroups] = useState([
     { id: 'g-1', name: 'VIP' },
     { id: 'g-2', name: 'General' },
     { id: 'g-3', name: 'Early Bird' },
   ])
   ```
3. **Don't rely on custom groups** - they'll disappear on refresh

## Recommendation

This is a **medium-sized feature** that requires:
- Database schema changes
- Migration script
- 3 API endpoints
- Frontend updates

**Estimated time:** 2-3 hours

**Priority:** Medium (nice-to-have, not critical)

For now, use the default 'vvip' group or hardcode additional groups in the frontend.

Would you like me to implement the full ticket groups feature?
