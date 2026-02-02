# COMPREHENSIVE API FIX PLAN

## Database Schema Reality Check

Based on diagnostic (Step 5077):

### Tables with TEXT event_id:
- `event_vendors.event_id` = TEXT
- `exhibitors.event_id` = TEXT

### Tables with BIGINT event_id:
- `speakers.event_id` = BIGINT
- `sponsors.event_id` = BIGINT (created manually)
- `events.id` = BIGINT
- `registrations.event_id` = BIGINT
- `promo_codes.event_id` = BIGINT

### Tables with camelCase columns (NO quotes):
- `EventRoleAssignment.eventId` = TEXT (camelCase, unquoted)
- `Ticket.eventId` = TEXT (camelCase, unquoted)
- `Order.eventId` = TEXT (camelCase, unquoted)
- `floor_plans.eventId` = BIGINT (camelCase, unquoted)

## APIs to Fix:

### ✅ DONE:
1. Speakers - Has fallback logic for event_id vs eventId

### 🔧 NEEDS FIX:
2. Vendors - Uses TEXT event_id (correct)
3. Exhibitors - Uses TEXT event_id (correct)
4. Sponsors - Uses BIGINT event_id (needs fallback)
5. Floor Plan - Uses BIGINT eventId (camelCase, needs fallback)
6. Team Members - Uses TEXT eventId (camelCase, correct)
7. Registrations - Uses BIGINT event_id (needs error logging)

## Strategy:

For each API, the query should:
1. Use the CORRECT type based on diagnostic
2. Add try-catch for schema variations
3. Log errors clearly

## Implementation Order:

1. Floor Plan (most complex)
2. Sponsors (simple)
3. Registrations (add logging)
4. Verify all others work
