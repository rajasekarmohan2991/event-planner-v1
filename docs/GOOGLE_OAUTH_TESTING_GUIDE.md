# Google OAuth Testing Guide

## Current Issue

Google OAuth login succeeds but:
- Profile shows "You are not signed in"
- Clicking "Create events" or "Explore events" logs user out

## Root Cause Analysis

The issue is that the JWT token isn't being properly populated with user data from the database after OAuth login.

## Latest Fix Applied

**File**: `/apps/web/lib/auth.ts`

**Changes**:
1. Prioritized database fetch for OAuth providers in JWT callback
2. Added console logging to track user data flow
3. Ensured token always has `id` and `role` fields

## Testing Steps

### Step 1: Clear Everything
```bash
# Clear browser data
1. Open DevTools (F12)
2. Application tab → Storage → Clear site data
3. Close all browser tabs
4. Restart browser
```

### Step 2: Check Server Logs
```bash
# In terminal
cd /Users/rajasekar/Event\ Planner\ V1
docker compose logs web -f
```

### Step 3: Test Google OAuth Login

1. **Navigate to**: http://localhost:3001/auth/login
2. **Click**: "Sign in with Google" button
3. **Select**: Your Google account
4. **Watch server logs** for these messages:
   ```
   ✅ Created new user from google: your@email.com
   OR
   ✅ Linked google to existing user your@email.com
   
   ✅ JWT: Loaded user from DB - your@email.com (ID: 123)
   ```

5. **Check sidebar**: Should show your name and email
6. **Check profile page**: Should show logged in
7. **Click "Create your events"**: Should NOT log you out

### Step 4: Verify Database

```bash
# Connect to database
docker compose exec postgres psql -U postgres -d eventplanner

# Check user exists
SELECT id, email, name, role, email_verified FROM users WHERE email = 'your@email.com';

# Check account linked
SELECT id, "userId", provider, "providerAccountId" FROM accounts WHERE "userId" = (SELECT id FROM users WHERE email = 'your@email.com');

# Exit
\q
```

Expected results:
- User record exists with your email
- Account record exists with provider='google'

## Debugging

### Check Session in Browser

1. Open DevTools → Application → Cookies
2. Look for: `next-auth.session-token`
3. Should be present and not expired

### Check API Response

1. Open DevTools → Network tab
2. Navigate to any page
3. Look for: `/api/auth/session`
4. Response should show:
   ```json
   {
     "user": {
       "id": "123",
       "email": "your@email.com",
       "name": "Your Name",
       "role": "USER"
     }
   }
   ```

### Common Issues

#### Issue 1: Session shows null
**Symptom**: `/api/auth/session` returns `{}`

**Cause**: JWT token not properly created

**Solution**:
1. Check server logs for errors in JWT callback
2. Verify database connection
3. Ensure user exists in database

#### Issue 2: User ID is missing
**Symptom**: Session has email but no ID

**Cause**: Database fetch failed in JWT callback

**Solution**:
1. Check server logs for database errors
2. Verify Prisma client is working
3. Check DATABASE_URL environment variable

#### Issue 3: Role is missing
**Symptom**: Session has ID but no role

**Cause**: User record doesn't have role field

**Solution**:
```sql
-- Fix in database
UPDATE users SET role = 'USER' WHERE role IS NULL;
```

## Manual Fix (If Needed)

If OAuth login still doesn't work, manually link the account:

```sql
-- Connect to database
docker compose exec postgres psql -U postgres -d eventplanner

-- Find your user ID
SELECT id FROM users WHERE email = 'your@email.com';

-- Manually create account link (replace USER_ID and GOOGLE_ID)
INSERT INTO accounts (
  "userId",
  type,
  provider,
  "providerAccountId",
  access_token,
  token_type,
  scope
) VALUES (
  USER_ID,  -- Replace with actual user ID
  'oauth',
  'google',
  'GOOGLE_ID',  -- Your Google account ID
  'dummy_token',
  'Bearer',
  'openid profile email'
);
```

## Environment Variables Check

Ensure these are set:

```bash
# Check .env file
cat apps/web/.env | grep GOOGLE

# Should show:
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3001
```

## Expected Console Logs

### Successful OAuth Flow

```
# SignIn callback
✅ Linked google to existing user your@email.com

# JWT callback
✅ JWT: Loaded user from DB - your@email.com (ID: 123)

# Session callback
(No errors)
```

### Failed OAuth Flow

```
# SignIn callback
OAuth sign-in error: [error details]

# JWT callback
❌ JWT: User not found in DB after signIn callback
OR
❌ JWT: Error fetching user from DB: [error]
```

## Next Steps

1. **Clear browser cache completely**
2. **Restart Docker services**:
   ```bash
   docker compose restart web
   ```
3. **Try OAuth login with logs open**
4. **Share server logs if issue persists**

## Alternative: Use Credentials Login

If OAuth continues to fail, use credentials login:

1. Navigate to: http://localhost:3001/auth/login
2. Enter email and password
3. Click "Sign In"
4. Should work normally

## Contact Points

If issue persists after all steps:

1. Share server logs from OAuth attempt
2. Share database query results
3. Share browser console errors
4. Share `/api/auth/session` response

---

**Status**: Fix deployed, awaiting testing
**Last Updated**: Nov 3, 2025 2:43 PM IST
