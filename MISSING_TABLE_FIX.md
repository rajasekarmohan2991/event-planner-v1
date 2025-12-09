# Missing Table Fix - rsvp_responses - Dec 9, 2025

## Issue Fixed
The `rsvp_responses` table was missing from the database, causing errors in analytics and RSVP functionality.

**Error Message**:
```
Raw query failed. Code: `42P01`. Message: `relation "rsvp_responses" does not exist`
```

## Table Created

### rsvp_responses Table
```sql
CREATE TABLE IF NOT EXISTS rsvp_responses (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  email VARCHAR(255) NOT NULL,
  response VARCHAR(50) DEFAULT 'YET_TO_RESPOND',
  response_token VARCHAR(255) UNIQUE,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, email)
);

-- Indexes for performance
CREATE INDEX idx_rsvp_responses_event ON rsvp_responses(event_id);
CREATE INDEX idx_rsvp_responses_token ON rsvp_responses(response_token);
CREATE INDEX idx_rsvp_responses_email ON rsvp_responses(email);
```

### Table Purpose
Stores RSVP responses from event invitations:
- **event_id**: Which event the RSVP is for
- **email**: Invitee's email address
- **response**: GOING, MAYBE, NOT_GOING, YET_TO_RESPOND
- **response_token**: Unique token for RSVP link
- **responded_at**: When they responded
- **Unique constraint**: One response per email per event

## Where It's Used

### 1. RSVP Send API
**File**: `/apps/web/app/api/events/[id]/rsvp/send/route.ts`
- Creates RSVP response record when sending invitations
- Generates unique token for each invitee
- Sets initial status to 'YET_TO_RESPOND'

### 2. RSVP Respond API
**File**: `/apps/web/app/api/rsvp/respond/route.ts`
- Updates RSVP response when user clicks link
- Records their response (GOING, MAYBE, NOT_GOING)
- Sets responded_at timestamp

### 3. Admin Analytics API
**File**: `/apps/web/app/api/admin/analytics/route.ts`
- Joins with rsvp_responses to show RSVP stats
- Counts total RSVPs per event
- Shows response breakdown

## Response Types

| Response | Meaning |
|----------|---------|
| YET_TO_RESPOND | Invitation sent, no response yet |
| GOING | Confirmed attendance |
| MAYBE | Interested but not confirmed |
| NOT_GOING | Declined invitation |

## Fix Applied

1. ✅ Created `rsvp_responses` table
2. ✅ Added indexes for performance
3. ✅ Added unique constraint (event_id, email)
4. ✅ Restarted web container

## Verification

Check if table exists:
```sql
SELECT * FROM rsvp_responses LIMIT 5;
```

Check table structure:
```sql
\d rsvp_responses
```

## Services Status
✅ **PostgreSQL**: Running and healthy
✅ **Redis**: Running and healthy
✅ **Java API**: Running on port 8081
✅ **Next.js Web**: Restarted and running on port 3001

## Summary
The missing `rsvp_responses` table has been created. RSVP functionality and analytics should now work without errors.
