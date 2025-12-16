# 📚 Lookup Management System - Complete Guide

## Overview

The Lookup Management System replaces all hard-coded enums with dynamic, database-driven lookup tables. This allows Super Admins to add, edit, and delete dropdown values from the UI without code changes.

## ✅ Features

- **Dynamic Dropdown Values**: All enum values are now editable from the admin UI
- **Auto-Propagation**: New values automatically appear in all new events/tenants
- **Tenant-Specific Overrides**: Tenants can have custom lookup values
- **Audit Trail**: All changes are logged for compliance
- **Soft Delete**: Values are deactivated, not deleted, to preserve data integrity
- **System Protection**: Critical values are marked as system-protected

## 📊 Supported Lookup Categories

All 19 enum types are now dynamic:

1. **System Role** - SUPER_ADMIN, ADMIN, USER
2. **Tenant Role** - TENANT_ADMIN, EVENT_MANAGER, VENUE_MANAGER, etc.
3. **Tenant Status** - ACTIVE, SUSPENDED, CANCELLED, TRIAL
4. **Subscription Plan** - FREE, STARTER, PRO, ENTERPRISE
5. **Promo Type** - PERCENT, FIXED
6. **Verification Status** - PENDING, APPROVED, REJECTED
7. **Registration Status** - PENDING, APPROVED, DENIED, CANCELLED
8. **Order Status** - CREATED, PAID, REFUNDED, CANCELLED
9. **Ticket Status** - ACTIVE, INACTIVE, HIDDEN
10. **Attendee Status** - REGISTERED, CONFIRMED, CHECKED_IN, CANCELLED
11. **Field Type** - TEXT, TEXTAREA, NUMBER, SELECT, etc.
12. **Event Role** - OWNER, ORGANIZER, STAFF, VIEWER
13. **RSVP Status** - GOING, INTERESTED, NOT_GOING, YET_TO_RESPOND
14. **Booth Type** - STANDARD, PREMIUM, ISLAND, CUSTOM
15. **Booth Status** - AVAILABLE, RESERVED, ASSIGNED
16. **Asset Kind** - IMAGE, DOC, URL
17. **Site Status** - DRAFT, PUBLISHED
18. **Notification Type** - EMAIL, SMS, WHATSAPP, PUSH
19. **Notification Status** - PENDING, SCHEDULED, SENT, FAILED, CANCELLED
20. **Notification Trigger** - MANUAL, EVENT_REMINDER_1WEEK, etc.

## 🚀 Installation Steps

### 1. Install Required Dependencies

```bash
cd apps/web
npm install pg @types/pg
```

### 2. Run Database Migrations

```bash
# Run the schema migration
psql $DATABASE_URL -f prisma/migrations/add_lookup_management_system.sql

# Seed initial data
psql $DATABASE_URL -f prisma/migrations/seed_lookup_data.sql
```

### 3. Verify Installation

```bash
# Check that tables were created
psql $DATABASE_URL -c "\dt lookup*"

# Verify seed data
psql $DATABASE_URL -c "SELECT name, value_count FROM (
  SELECT lc.name, COUNT(lv.id) as value_count
  FROM lookup_categories lc
  LEFT JOIN lookup_values lv ON lv.category_id = lc.id
  GROUP BY lc.id, lc.name
) t ORDER BY name;"
```

## 🎨 Using the Admin UI

### Access the Lookup Management Page

1. Login as **Super Admin**
2. Navigate to: **Super Admin** → **System Settings** → **Lookup Management**
3. Direct URL: `/super-admin/lookups`

### Managing Lookup Values

#### **Add New Value**
1. Select a category from the left sidebar
2. Click "Add Value" button
3. Fill in:
   - **Value**: Internal code (e.g., `VIP_BOOTH`)
   - **Label**: Display name (e.g., `VIP Booth`)
   - **Description**: Optional description
   - **Color Code**: Hex color for UI (e.g., `#3B82F6`)
   - **Sort Order**: Display order in dropdowns
   - **Active**: Enable/disable the value
   - **Default**: Set as default for new records
4. Click "Save"

#### **Edit Value**
1. Click the edit icon (✏️) next to any value
2. Modify fields
3. Click "Save"

#### **Delete Value**
1. Click the delete icon (🗑️) next to any value
2. Confirm deletion
3. Value is soft-deleted (marked inactive)

**Note**: System-protected values cannot be edited or deleted.

## 💻 Using Lookups in Code

### Server-Side Usage

```typescript
import { getLookupValues, getLookupOptions, getLookupLabel } from '@/lib/lookups'

// Get all booth types
const boothTypes = await getLookupValues('BOOTH_TYPE')
// Returns: [{ value: 'STANDARD', label: 'Standard', colorCode: '#64748B', ... }, ...]

// Get dropdown options
const options = await getLookupOptions('REGISTRATION_STATUS')
// Returns: [{ value: 'PENDING', label: 'Pending', color: '#F59E0B' }, ...]

// Get label for a value
const label = await getLookupLabel('ORDER_STATUS', 'PAID')
// Returns: "Paid"

// Validate a value
const isValid = await isValidLookupValue('TICKET_STATUS', 'ACTIVE')
// Returns: true
```

### Client-Side Usage (React Components)

```typescript
'use client'
import { useState, useEffect } from 'react'

function EventForm() {
  const [eventTypes, setEventTypes] = useState([])

  useEffect(() => {
    fetch('/api/admin/lookups?category=EVENT_TYPE')
      .then(res => res.json())
      .then(data => setEventTypes(data.values))
  }, [])

  return (
    <select>
      {eventTypes.map(type => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  )
}
```

### API Endpoints

#### **GET /api/admin/lookups**
Get all categories or values for a specific category

```bash
# Get all categories
curl https://your-app.com/api/admin/lookups

# Get values for a category
curl https://your-app.com/api/admin/lookups?category=BOOTH_TYPE
```

#### **POST /api/admin/lookups**
Create a new lookup value

```bash
curl -X POST https://your-app.com/api/admin/lookups \
  -H "Content-Type: application/json" \
  -d '{
    "categoryCode": "BOOTH_TYPE",
    "value": "VIP",
    "label": "VIP Booth",
    "description": "Premium VIP booth with exclusive amenities",
    "colorCode": "#8B5CF6",
    "sortOrder": 5,
    "isActive": true,
    "isDefault": false
  }'
```

#### **PUT /api/admin/lookups/[id]**
Update an existing lookup value

```bash
curl -X PUT https://your-app.com/api/admin/lookups/lookup_123 \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Updated Label",
    "colorCode": "#10B981"
  }'
```

#### **DELETE /api/admin/lookups/[id]**
Soft-delete a lookup value

```bash
curl -X DELETE https://your-app.com/api/admin/lookups/lookup_123
```

## 🔄 Auto-Propagation for New Events/Tenants

### How It Works

When a new event or tenant is created, default lookup values are automatically copied:

```typescript
// Example: When creating a new event
async function createEvent(eventData) {
  const event = await prisma.event.create({ data: eventData })
  
  // Auto-populate with default lookup values
  const defaultStatuses = await getLookupValues('REGISTRATION_STATUS')
  const defaultTicketTypes = await getLookupValues('TICKET_STATUS')
  
  // Event now has access to all current lookup values
  return event
}
```

### Applying Changes to Existing Records

By default, lookup changes only affect **new** records. To apply to existing records:

1. Use the "Apply to All" toggle in the admin UI (future feature)
2. Or run a migration script:

```sql
-- Example: Update all events to use new booth type
UPDATE booths 
SET type = 'VIP' 
WHERE type = 'PREMIUM' AND event_id IN (SELECT id FROM events WHERE created_at > '2024-01-01');
```

## 🔒 Security & Permissions

- Only **SUPER_ADMIN** users can access lookup management
- System-protected values cannot be modified or deleted
- All changes are logged in `lookup_audit_log` table
- Tenant-specific overrides are isolated by `tenant_id`

## 📈 Best Practices

### 1. Use Descriptive Labels
```typescript
// ❌ Bad
{ value: 'TYPE1', label: 'Type 1' }

// ✅ Good
{ value: 'CONFERENCE', label: 'Conference & Summit' }
```

### 2. Set Meaningful Sort Orders
```typescript
// Order by importance or frequency of use
{ value: 'ACTIVE', sortOrder: 1 }
{ value: 'PENDING', sortOrder: 2 }
{ value: 'CANCELLED', sortOrder: 10 }
```

### 3. Use Color Codes Consistently
```typescript
// Success states: Green (#10B981)
// Warning states: Yellow (#F59E0B)
// Error states: Red (#EF4444)
// Info states: Blue (#3B82F6)
```

### 4. Add Metadata for Complex Values
```typescript
{
  value: 'ENTERPRISE',
  label: 'Enterprise',
  metadata: {
    maxEvents: -1,  // Unlimited
    maxUsers: -1,
    features: ['whiteLabel', 'customDomain', 'api']
  }
}
```

## 🐛 Troubleshooting

### Issue: "Cannot find module 'pg'"
**Solution**: Install the PostgreSQL client library
```bash
npm install pg @types/pg
```

### Issue: Lookups not appearing in dropdown
**Solution**: Check that values are marked as `is_active = true`
```sql
SELECT * FROM lookup_values WHERE category_id = 'cat_booth_type' AND is_active = false;
```

### Issue: Changes not reflecting immediately
**Solution**: Clear cache or restart the dev server
```bash
# Restart Next.js dev server
npm run dev
```

## 🔄 Migration from Hard-Coded Enums

### Step 1: Identify Enum Usage
```bash
# Find all enum references in your code
grep -r "enum BoothType" apps/web/
```

### Step 2: Replace with Lookup Calls
```typescript
// Before
import { BoothType } from '@prisma/client'
const type: BoothType = 'STANDARD'

// After
import { getLookupValue } from '@/lib/lookups'
const type = await getLookupValue('BOOTH_TYPE', 'STANDARD')
```

### Step 3: Update Forms
```typescript
// Before
<select>
  <option value="STANDARD">Standard</option>
  <option value="PREMIUM">Premium</option>
</select>

// After
const boothTypes = await getLookupOptions('BOOTH_TYPE')
<select>
  {boothTypes.map(t => (
    <option key={t.value} value={t.value}>{t.label}</option>
  ))}
</select>
```

## 📊 Database Schema Reference

### Tables

- **lookup_categories**: Category definitions
- **lookup_values**: Global lookup values
- **tenant_lookup_values**: Tenant-specific overrides
- **lookup_audit_log**: Change history

### Key Columns

- `is_system`: Prevents deletion of critical values
- `is_default`: Auto-selected for new records
- `is_active`: Soft delete flag
- `sort_order`: Display order in dropdowns
- `metadata`: JSON field for custom properties

## 🎯 Next Steps

1. **Add Navigation Link**: Update `@/Users/rajasekar/Event Planner V1/apps/web/components/admin/AdminSidebar.tsx` to include Lookup Management link
2. **Create Client Hook**: Build `useLookupValues` React hook for easier client-side usage
3. **Add Bulk Import**: Allow CSV import of lookup values
4. **Add Export**: Export lookups to CSV/JSON
5. **Add Versioning**: Track lookup value changes over time

## 📞 Support

For issues or questions about the Lookup Management System:
- Check the audit log: `SELECT * FROM lookup_audit_log ORDER BY changed_at DESC LIMIT 20;`
- Review API logs in your application
- Contact your system administrator

---

**Last Updated**: December 2024  
**Version**: 1.0.0
