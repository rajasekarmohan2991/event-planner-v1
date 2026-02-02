# API TEST REPORT - December 21, 2025, 11:15 PM IST

## Test URL: https://aypheneventplanner.vercel.app

### ✅ WORKING APIs:

1. **Speakers API** - ✅ WORKING
   - GET `/api/events/17/speakers`
   - Status: 200 OK
   - Returns: 1 speaker (Jane, CTO)
   - Response time: Good

2. **Sponsors API** - ✅ WORKING
   - GET `/api/events/17/sponsors`
   - Status: 200 OK
   - Returns: 1 sponsor (new age sponsr)
   - Response time: Good

### ❌ FAILING APIs:

3. **Team Members API** - ❌ FAILING (500)
   - GET `/api/events/17/team/members`
   - Error: `column a.userid does not exist`
   - **Issue**: PostgreSQL is case-sensitive. Query uses `a.userId` but column is actually `a.userid` (lowercase)
   - **Fix Required**: Change query from `a.userId` to `a."userId"` (with quotes)

4. **Floor Plans API** - ⚠️ REQUIRES AUTH
   - GET `/api/events/17/floor-plan`
   - Status: 401 Unauthorized
   - **Cannot test without session cookie**

5. **Vendors API** - ⚠️ REQUIRES AUTH
   - GET `/api/events/17/vendors`
   - Status: 401 Unauthorized
   - **Cannot test without session cookie**

6. **Exhibitors API** - ⚠️ REQUIRES AUTH
   - GET `/api/events/17/exhibitors`
   - Status: 401 Unauthorized
   - **Cannot test without session cookie**

### ⚠️ COULD NOT TEST (Auth Required):

- Registrations POST
- Promo Codes POST
- Session creation
- And all other POST/PUT/DELETE endpoints

## CRITICAL ISSUES IDENTIFIED:

### 1. Team Members API - Column Name Case Sensitivity
**File**: `/apps/web/app/api/events/[id]/team/members/route.ts`
**Line**: ~26-30

**Current (BROKEN)**:
```sql
SELECT a.userId, a.role, a.createdAt
FROM "EventRoleAssignment" a
```

**Fix Needed**:
```sql
SELECT a."userId", a.role, a."createdAt"
FROM "EventRoleAssignment" a
```

PostgreSQL requires EXACT case match. Since the diagnostic showed the columns are `userId` (camelCase), they must be quoted in queries.

## SUMMARY:

### What's Working:
- ✅ Speakers (GET)
- ✅ Sponsors (GET)

### What's Broken:
- ❌ Team Members (column name case issue)

### What Needs Auth to Test:
- ⚠️ Floor Plans
- ⚠️ Vendors
- ⚠️ Exhibitors
- ⚠️ Registrations
- ⚠️ Promo Codes

## RECOMMENDATION:

**IMMEDIATE FIX**: Fix the Team Members API column names (5 minutes)

**THEN TEST**: 
1. Login to the app
2. Test Floor Plans (seat selector)
3. Test Registrations
4. Test Vendors
5. Test Promo Codes

Once logged in, the protected endpoints can be tested through the UI.

---

**Bottom Line**: 
- 2 out of 2 testable public APIs are working
- 1 API has a simple column name fix needed
- Rest require authentication to test properly
