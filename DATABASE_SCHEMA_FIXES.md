# Database Schema Fixes - Dec 8, 2025

## Issues Fixed

### 1. Foreign Key Constraint Violations
**Problem**: Java API was failing to start due to foreign key violations on `promo_codes` and `sessions` tables referencing non-existent `event_id=12`.

**Solution**: Event 12 was created successfully, and the foreign key constraints are now satisfied.

### 2. Missing `tenant_id` Columns
**Problem**: Multiple tables were missing the `tenant_id` column, causing SQL errors:
- `event_team_members`
- `speakers`
- `sessions`
- `sponsors`

**Solution**: Added `tenant_id VARCHAR(255)` column to all these tables and populated them from the parent `events` table:
```sql
ALTER TABLE event_team_members ADD COLUMN tenant_id VARCHAR(255);
UPDATE event_team_members etm SET tenant_id = e.tenant_id FROM events e WHERE etm.event_id = e.id;

ALTER TABLE speakers ADD COLUMN tenant_id VARCHAR(255);
UPDATE speakers s SET tenant_id = e.tenant_id FROM events e WHERE s.event_id = e.id;

ALTER TABLE sessions ADD COLUMN tenant_id VARCHAR(255);
UPDATE sessions s SET tenant_id = e.tenant_id FROM events e WHERE s.event_id = e.id;

ALTER TABLE sponsors ADD COLUMN tenant_id VARCHAR(255);
UPDATE sponsors sp SET tenant_id = e.tenant_id FROM events e WHERE sp.event_id = e.id;
```

### 3. Missing `activity_log` Table
**Problem**: Dashboard was failing with error: `relation "activity_log" does not exist`

**Solution**: Created the `activity_log` table with proper schema:
```sql
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  action_type VARCHAR(100) NOT NULL,
  action_description TEXT,
  entity_type VARCHAR(100),
  entity_id BIGINT,
  entity_name VARCHAR(255),
  metadata JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
```

### 4. BigInt Serialization Issues
**Problem**: Next.js API was failing with `TypeError: Do not know how to serialize a BigInt` in ticket settings endpoint.

**Status**: This is a known issue in `/api/events/[id]/settings/tickets/route.ts` that needs BigInt values to be converted to strings before JSON serialization.

### 5. JSONB Operator Issues
**Problem**: Analytics endpoint was failing with `operator does not exist: text ->> unknown`

**Status**: This indicates `data_json` column in `registrations` table may need to be JSONB type instead of TEXT.

## Migration Applied

All schema fixes were applied via SQL migration executed on the PostgreSQL database:
- 19 rows updated in `event_team_members`
- 7 rows updated in `speakers`
- 30 rows updated in `sessions`
- 4 rows updated in `sponsors`
- `activity_log` table created successfully

## Services Status

✅ **PostgreSQL**: Running and healthy
✅ **Redis**: Running and healthy
✅ **Java API**: Started successfully on port 8081
✅ **Next.js Web**: Built and running on port 3001

## Known Remaining Issues

1. **BigInt Serialization in Ticket Settings**: Need to convert BigInt to string in `/api/events/[id]/settings/tickets/route.ts`
2. **Analytics JSONB Casting**: Need to ensure proper JSONB casting in analytics queries
3. **Missing `rsvp_responses` table**: Referenced in analytics but doesn't exist (non-critical)

## Testing Recommendations

1. **Add Sessions**: Test creating new sessions for events - should now work with `tenant_id` column present
2. **Add Team Members**: Test adding team members - should now work with proper schema
3. **View Company Users**: Test viewing existing company users in team member selection
4. **Dashboard Analytics**: Verify dashboard loads without errors
5. **Activity Log**: Verify activity logging works properly

## Files Modified

- Database schema (via SQL migration)
- No code files modified in this fix

## Next Steps

1. Test session creation for new events
2. Test team member addition and viewing company users
3. Fix remaining BigInt serialization issues if they appear
4. Consider adding proper error handling for missing tables like `rsvp_responses`
