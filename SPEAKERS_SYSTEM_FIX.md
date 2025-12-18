# Speakers Management System - Fix Guide

## Issue
`/api/events/9/speakers` returns 500 error

## Root Cause
The Prisma schema has a missing relation between `SessionSpeaker` and `EventSession`.

## Required Schema Fix

### Current Schema (BROKEN):
```prisma
model SessionSpeaker {
  id        BigInt    @id @default(autoincrement())
  sessionId BigInt    @map("session_id")
  speakerId BigInt    @map("speaker_id")
  
  speaker   Speaker   @relation(fields: [speakerId], references: [id], onDelete: Cascade)
  
  @@unique([sessionId, speakerId])
  @@map("session_speakers")
}

model EventSession {
  id          BigInt    @id @default(autoincrement())
  eventId     BigInt    @map("event_id")
  // ... other fields
  // MISSING: speakers relation
  @@map("sessions")
}
```

### Fixed Schema (CORRECT):
```prisma
model SessionSpeaker {
  id        BigInt       @id @default(autoincrement())
  sessionId BigInt       @map("session_id")
  speakerId BigInt       @map("speaker_id")
  
  session   EventSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  speaker   Speaker      @relation(fields: [speakerId], references: [id], onDelete: Cascade)
  
  @@unique([sessionId, speakerId])
  @@map("session_speakers")
}

model EventSession {
  id          BigInt    @id @default(autoincrement())
  eventId     BigInt    @map("event_id")
  tenantId    String?   @map("tenant_id") @db.VarChar(255)
  title       String    @db.VarChar(255)
  description String?   @db.Text
  startTime   DateTime  @map("start_time") @db.Timestamptz(6)
  endTime     DateTime  @map("end_time") @db.Timestamptz(6)
  room        String?   @db.VarChar(255)
  track       String?   @db.VarChar(255)
  capacity    Int?
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  speakers    SessionSpeaker[]  // ADD THIS LINE

  @@map("sessions")
}
```

## Steps to Fix

### 1. Update Prisma Schema
Edit `apps/web/prisma/schema.prisma`:

**Line ~1229 - Update SessionSpeaker:**
```prisma
model SessionSpeaker {
  id        BigInt       @id @default(autoincrement())
  sessionId BigInt       @map("session_id")
  speakerId BigInt       @map("speaker_id")
  
  session   EventSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)  // ADD THIS
  speaker   Speaker      @relation(fields: [speakerId], references: [id], onDelete: Cascade)
  
  @@unique([sessionId, speakerId])
  @@map("session_speakers")
}
```

**Line ~698 - Update EventSession:**
```prisma
model EventSession {
  id          BigInt    @id @default(autoincrement())
  eventId     BigInt    @map("event_id")
  tenantId    String?   @map("tenant_id") @db.VarChar(255)
  title       String    @db.VarChar(255)
  description String?   @db.Text
  startTime   DateTime  @map("start_time") @db.Timestamptz(6)
  endTime     DateTime  @map("end_time") @db.Timestamptz(6)
  room        String?   @db.VarChar(255)
  track       String?   @db.VarChar(255)
  capacity    Int?
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  speakers    SessionSpeaker[]  // ADD THIS LINE

  @@map("sessions")
}
```

### 2. Generate Prisma Client
```bash
cd apps/web
npx prisma generate
```

### 3. Test the API
```bash
curl http://localhost:3000/api/events/9/speakers?page=0&size=20
```

## How the System Works

### Workflow:
1. **Create Event** → Sessions are created
2. **Add Speakers** → Speaker is created + assigned to a session
3. **View Calendar** → Shows sessions with speakers and time slots
4. **Conflict Prevention** → Same time slot can't be double-booked

### Database Structure:
```
Event (id: 9)
  ├── EventSession (id: 1, time: 10:00-11:00)
  │     └── SessionSpeaker (links Speaker 1 to Session 1)
  │           └── Speaker (id: 1, name: "John Doe")
  │
  ├── EventSession (id: 2, time: 11:00-12:00)
  │     └── SessionSpeaker (links Speaker 2 to Session 2)
  │           └── Speaker (id: 2, name: "Jane Smith")
```

### API Endpoints:

#### GET /api/events/{id}/speakers
- Lists all speakers for an event
- Returns: `{ data: [...], pagination: {...} }`

#### POST /api/events/{id}/speakers
- Creates a speaker
- Automatically creates a session
- Links speaker to session
- Body:
```json
{
  "name": "John Doe",
  "title": "CEO",
  "bio": "...",
  "email": "john@example.com",
  "sessionTitle": "Keynote Speech",
  "sessionDescription": "Opening keynote"
}
```

#### PUT /api/events/{id}/speakers/{speakerId}
- Updates speaker details

#### DELETE /api/events/{id}/speakers/{speakerId}
- Removes speaker and unlinks from sessions

#### POST /api/events/{id}/sessions/{sessionId}/speakers/{speakerId}
- Assigns existing speaker to existing session
- Checks for time conflicts

#### DELETE /api/events/{id}/sessions/{sessionId}/speakers/{speakerId}
- Removes speaker from session

## Features

### 1. Speaker Management
- Add speakers with bio, photo, social links
- Edit speaker details
- Delete speakers

### 2. Session Assignment
- Assign speakers to sessions
- Multiple speakers per session
- View speaker's schedule

### 3. Conflict Prevention
- Check if speaker is already booked at that time
- Prevent double-booking
- Show conflicts in UI

### 4. Calendar Integration
- Sessions appear in calendar
- Color-coded by speaker
- Click to view details

## Frontend Integration

### Speakers Page (`/events/[id]/speakers`)
- Lists all speakers
- Add new speaker button
- Edit/Delete actions
- Shows assigned sessions

### Sessions Page (`/events/[id]/sessions`)
- Lists all sessions
- Assign speaker dropdown
- Shows speaker details
- Time conflict warnings

### Calendar View
- Shows sessions with speakers
- Color-coded by track
- Click to edit
- Drag to reschedule (with conflict check)

## Error Handling

### Common Errors:
1. **500 Error** - Schema relation missing (this fix)
2. **404 Error** - Event not found
3. **409 Conflict** - Speaker already booked at that time
4. **400 Bad Request** - Missing required fields

## Testing Checklist

- [ ] Can list speakers
- [ ] Can create speaker
- [ ] Speaker auto-creates session
- [ ] Can assign speaker to existing session
- [ ] Time conflict is detected
- [ ] Can remove speaker from session
- [ ] Can delete speaker
- [ ] Calendar shows sessions correctly
- [ ] No double-booking allowed

## Next Steps

1. Fix Prisma schema (add relations)
2. Run `npx prisma generate`
3. Test API endpoints
4. Verify UI works
5. Test conflict detection
6. Deploy to production
