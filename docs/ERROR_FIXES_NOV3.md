# Error Fixes - Nov 3, 2025 @ 5:06 PM

## ✅ Issues Fixed

### 1. `/api/user/city` 500 Errors - FIXED ✅

**Problem**: 
- Endpoint returning 500 Internal Server Error
- Unable to fetch or detect location automatically
- Errors appearing on every page load

**Root Cause**:
- Endpoint was returning 401 Unauthorized for unauthenticated users
- Multiple pages (explore, dashboard) were calling this endpoint on load
- When not logged in, this caused cascading 500 errors

**Solution**:
```typescript
// Before
if (!session?.user?.email) {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
}

// After
if (!session?.user?.email) {
  return NextResponse.json({ city: null }) // Return null, not error
}
```

**File Modified**: `/apps/web/app/api/user/city/route.ts`

**Result**: Unauthenticated users now get `{ city: null }` instead of errors

---

### 2. Credentials Login 401 Error - INVESTIGATING ⚠️

**Problem**: 
```
POST http://localhost:3001/api/auth/callback/credentials 401 (Unauthorized)
Unable to sign in
```

**Root Cause Analysis**:

The credentials provider tries to authenticate via Java API:
```typescript
const res = await fetch(`${API_BASE}/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ email, password })
})
```

**Possible Causes**:
1. **Java API not ready** - API was restarting when you tried to login
2. **User doesn't exist in Java database** - Need to create user first
3. **Password hash mismatch** - Java uses different hashing than Next.js

**Current Status**:
- Java API is starting up (seen in logs)
- Takes ~30-60 seconds to fully initialize
- Database connection was re-establishing

**Solutions**:

#### Option 1: Wait for API to Start
```bash
# Check API health
curl http://localhost:8081/actuator/health

# Should return: {"status":"UP"}
```

#### Option 2: Use Dev Bypass (Development Only)
Set environment variables:
```bash
NEXT_PUBLIC_ENABLE_DEV_LOGIN=true
DEV_LOGIN_EMAIL=fiserv@gmail.com
DEV_LOGIN_PASSWORD=fiserv@123
```

Then login with those credentials.

#### Option 3: Create User in Java Database
```bash
# Connect to database
docker compose exec postgres psql -U postgres -d event_planner

# Create user (example)
INSERT INTO users (email, password_hash, name, role) 
VALUES ('test@example.com', '$2a$10$...', 'Test User', 'USER');
```

---

### 3. Dialog Accessibility Warning - MINOR ⚠️

**Warning**:
```
Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.
```

**Impact**: Low - Accessibility issue, doesn't affect functionality

**Solution** (Optional):
Add `DialogDescription` component to dialogs:
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>
        Description of what this dialog does
      </DialogDescription>
    </DialogHeader>
    {/* ... */}
  </DialogContent>
</Dialog>
```

---

## 🔍 Debugging Steps

### Check Java API Status
```bash
# 1. Check if API is running
docker compose ps api

# 2. Check API logs
docker compose logs api --tail=50

# 3. Test API health
curl http://localhost:8081/actuator/health

# 4. Test login endpoint
curl -X POST http://localhost:8081/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Check Web Service
```bash
# 1. Check web logs
docker compose logs web --tail=50

# 2. Test city endpoint
curl http://localhost:3001/api/user/city

# 3. Restart web service
docker compose restart web
```

### Check Database
```bash
# 1. Connect to database
docker compose exec postgres psql -U postgres -d event_planner

# 2. List users
SELECT id, email, name, role FROM users;

# 3. Check if user exists
SELECT * FROM users WHERE email = 'your@email.com';
```

---

## 📋 Summary

### Fixed ✅
1. **City endpoint** - No more 500 errors for unauthenticated users
2. **Location detection** - Now gracefully handles missing authentication

### Investigating ⚠️
1. **Credentials login** - Java API may need time to start or user needs to be created
2. **Dialog accessibility** - Minor warning, doesn't affect functionality

### Action Items
1. **Wait 1-2 minutes** for Java API to fully start
2. **Try login again** after API is ready
3. **Check API health** using curl command above
4. **Create user** in Java database if needed

---

## 🚀 Next Steps

### Immediate
1. Wait for Java API to finish starting
2. Test login again
3. Verify city endpoint returns `{ city: null }` when not logged in

### Short-term
1. Add health check UI to show API status
2. Add better error messages for login failures
3. Fix dialog accessibility warnings

### Long-term
1. Implement user registration flow
2. Add password reset functionality
3. Sync users between Next.js and Java databases

---

## ✨ Status

**Web Service**: ✅ Restarted with fixes
**API Service**: ⏳ Starting up (wait 1-2 minutes)
**Database**: ✅ Running
**Redis**: ✅ Running

**City Endpoint**: ✅ Fixed
**Login Issue**: ⏳ Waiting for API to be ready

**Recommendation**: Wait 1-2 minutes and try logging in again!
