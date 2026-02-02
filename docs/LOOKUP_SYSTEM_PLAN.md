# Dropdown Lookup System - Quick Reference

## Step 1: Hardcoded Dropdowns Found

### Components
- **EventFormSteps.tsx**: Event Types, Categories, Timezones, Time Slots
- **Event Mode**: IN_PERSON, VIRTUAL, HYBRID (Java API)
- **User Roles**: USER, ADMIN, ORGANIZER

### Database Enums (Already Good)
- PromoType, VerificationStatus, RegistrationStatus, OrderStatus
- TicketStatus, AttendeeStatus, FieldType, EventRole, RSVPStatus
- BoothType, BoothStatus, SiteStatus, NotificationType
- NotificationStatus, NotificationTrigger, AssetKind

## Step 2: Database References

| Dropdown | Storage | Priority |
|----------|---------|----------|
| Event Types | Java API | HIGH |
| Categories | Java API | HIGH |
| Event Mode | Java API | HIGH |
| Timezones | Hardcoded | MEDIUM |
| All Enums | Prisma Enums | LOW (keep as-is) |

## Step 3: Lookup Table Schema

```prisma
enum LookupCategory {
  EVENT_TYPE
  EVENT_CATEGORY
  EVENT_MODE
  TIMEZONE
  USER_ROLE
}

model Lookup {
  id          String         @id @default(cuid())
  category    LookupCategory
  code        String
  label       String
  colorCode   String?        // #3498db
  icon        String?
  sortOrder   Int            @default(0)
  isActive    Boolean        @default(true)
  isSystem    Boolean        @default(false)
  metadata    Json?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  tenantId    String?
  
  @@unique([category, code])
  @@index([category, isActive, sortOrder])
}
```

### Color Scheme
- 🔵 Blue #3498db - Event Types, Event Mode
- 🟢 Green #2ecc71 - Categories
- 🟡 Yellow #f39c12 - Timezones
- 🟤 Brown #8b4513 - User Roles

## Step 4: API Endpoints

See LOOKUP_API_ENDPOINTS.md for full implementation.

### Quick Reference
```
GET    /api/lookups?category=EVENT_TYPE
GET    /api/lookups/:id
POST   /api/lookups
PUT    /api/lookups/:id
DELETE /api/lookups/:id
```
