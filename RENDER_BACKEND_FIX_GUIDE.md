# Render Backend - Complete Fix Guide

## Critical Issues on Render Backend

Your Render backend (`event-planner-v1.onrender.com`) is failing with:
1. ❌ **500 Error** - POST /api/events/[id]/registrations
2. ❌ **400 Error** - POST /api/events/[id]/promo-codes

---

## Step 1: Access Render Dashboard

1. Go to https://render.com
2. Log in to your account
3. Find `event-planner-v1` service
4. Click on it to open the dashboard

---

## Step 2: Check Service Status

### Check if Service is Running:
```
Dashboard → event-planner-v1 → Status
```

**Possible States:**
- 🟢 **Live** - Service is running
- 🔴 **Failed** - Service crashed
- 🟡 **Building** - Currently deploying
- ⚪ **Suspended** - Service is paused

**If Failed or Suspended:**
1. Click "Manual Deploy" → "Deploy latest commit"
2. Wait for build to complete
3. Check logs for errors

---

## Step 3: Check Logs (Most Important!)

### View Real-time Logs:
```
Dashboard → event-planner-v1 → Logs
```

### Look for These Errors:

#### Database Connection Errors:
```
❌ Error: connect ECONNREFUSED
❌ Error: getaddrinfo ENOTFOUND
❌ Error: password authentication failed
❌ Error: database "..." does not exist
```

**Fix:** Check DATABASE_URL environment variable

#### Missing Environment Variables:
```
❌ Error: DATABASE_URL is not defined
❌ Error: JWT_SECRET is not defined
❌ Error: SMTP credentials missing
```

**Fix:** Add missing environment variables

#### Port Binding Errors:
```
❌ Error: listen EADDRINUSE :::3000
❌ Error: Port 3000 is already in use
```

**Fix:** Use `process.env.PORT` instead of hardcoded port

#### Application Errors:
```
❌ TypeError: Cannot read property 'x' of undefined
❌ ReferenceError: x is not defined
❌ SyntaxError: Unexpected token
```

**Fix:** Code bugs - need to fix in source code

---

## Step 4: Verify Environment Variables

### Required Environment Variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
JWT_SECRET=your-secret-key-here
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://aypheneventplanner.vercel.app

# Email (if using)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API URLs
NEXT_PUBLIC_API_BASE_URL=https://event-planner-v1.onrender.com
INTERNAL_API_BASE_URL=https://event-planner-v1.onrender.com

# Other
NODE_ENV=production
```

### How to Add/Update:
```
Dashboard → event-planner-v1 → Environment
→ Add Environment Variable
→ Key: DATABASE_URL
→ Value: postgresql://...
→ Save Changes
```

**Important:** After adding/changing env vars, you MUST redeploy!

---

## Step 5: Check Database Connection

### Test Database Connectivity:

1. **Check if database exists:**
   - Go to your database provider (e.g., Render PostgreSQL, Supabase, etc.)
   - Verify database is running
   - Check connection string is correct

2. **Test connection from Render:**
   - Add a health check endpoint
   - Check logs for database connection success/failure

3. **Run migrations:**
   ```bash
   # If using Prisma
   npx prisma migrate deploy
   
   # If using raw SQL
   psql $DATABASE_URL < schema.sql
   ```

---

## Step 6: Fix Common Issues

### Issue 1: Registration 500 Error

**Possible Causes:**
1. Database connection failed
2. Missing required fields
3. Payment table doesn't exist
4. Email service not configured
5. Transaction failed

**Debug Steps:**
```
1. Check Render logs during registration attempt
2. Look for error message
3. Common errors:
   - "relation 'registrations' does not exist" → Run migrations
   - "column 'x' does not exist" → Update database schema
   - "null value in column 'x'" → Add default values
```

**Fix:**
```sql
-- Ensure tables exist
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT NOT NULL,
  email VARCHAR(255) NOT NULL,
  data_json JSONB,
  type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'APPROVED',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(id),
  event_id BIGINT NOT NULL,
  user_id BIGINT,
  amount_in_minor INTEGER,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50),
  payment_method VARCHAR(50),
  payment_details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_redemptions (
  id BIGSERIAL PRIMARY KEY,
  promo_code_id BIGINT NOT NULL,
  user_id BIGINT,
  order_amount NUMERIC,
  discount_amount NUMERIC,
  redeemed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registration_approvals (
  id BIGSERIAL PRIMARY KEY,
  registration_id UUID NOT NULL,
  event_id BIGINT NOT NULL,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### Issue 2: Promo Codes 400 Error

**Possible Causes:**
1. Missing required fields in request
2. Invalid data types
3. Table doesn't exist
4. Validation failing

**Debug Steps:**
```
1. Check what data is being sent
2. Check Render logs for validation errors
3. Verify promo_codes table exists
```

**Fix:**
```sql
-- Ensure promo_codes table exists
CREATE TABLE IF NOT EXISTS promo_codes (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE',
  amount NUMERIC NOT NULL,
  max_redemptions INTEGER DEFAULT -1,
  used_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  min_order_amount NUMERIC DEFAULT 0,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_event ON promo_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
```

---

## Step 7: Deploy Backend Code

### Option A: Deploy from Local Next.js API

Since your local API is working perfectly, you can deploy it to Render:

1. **Create new Web Service on Render:**
   ```
   Dashboard → New → Web Service
   → Connect your GitHub repo
   → Root Directory: apps/web
   → Build Command: npm install && npm run build
   → Start Command: npm start
   → Environment: Node
   ```

2. **Add Environment Variables** (from Step 4)

3. **Deploy**

### Option B: Fix Existing Backend

If you have a separate backend repo:

1. **Pull latest code**
2. **Copy working API routes from Next.js:**
   - `/apps/web/app/api/events/[id]/registrations/route.ts`
   - `/apps/web/app/api/events/[id]/promo-codes/route.ts`
3. **Update backend with fixed code**
4. **Push to GitHub**
5. **Render will auto-deploy**

---

## Step 8: Test After Deployment

### Test Registration:
```bash
curl -X POST https://event-planner-v1.onrender.com/api/events/8/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "phone": "+1234567890",
      "totalPrice": 1000
    },
    "type": "VIRTUAL"
  }'
```

**Expected:** 201 Created with registration data

### Test Promo Code:
```bash
curl -X POST https://event-planner-v1.onrender.com/api/events/8/promo-codes \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST20",
    "discountType": "PERCENTAGE",
    "discountAmount": 20,
    "maxUses": 100,
    "isActive": true
  }'
```

**Expected:** 201 Created with promo code data

---

## Step 9: Monitor and Debug

### Enable Detailed Logging:

Add to your backend code:
```javascript
// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    headers: req.headers
  })
  next()
})

// Log all errors
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})
```

### Check Logs Regularly:
```
Render Dashboard → Logs → Filter by "Error"
```

---

## Step 10: Health Check Endpoint

Add a health check to verify everything is working:

```javascript
// GET /health
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.query('SELECT 1')
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    })
  }
})
```

**Test:** https://event-planner-v1.onrender.com/health

---

## Quick Checklist

- [ ] Service is running on Render
- [ ] All environment variables are set
- [ ] DATABASE_URL is correct
- [ ] Database tables exist
- [ ] Migrations have been run
- [ ] Logs show no errors
- [ ] Health check returns 200
- [ ] Registration endpoint returns 201
- [ ] Promo code endpoint returns 201
- [ ] Email service is configured (if needed)
- [ ] CORS is configured correctly

---

## Alternative: Use Local API Only

**Simplest Solution:**

Instead of fixing Render backend, just use your local Next.js API which is already working perfectly:

1. **Update frontend to use local API:**
   ```typescript
   // Change from:
   const url = 'https://event-planner-v1.onrender.com/api/...'
   
   // To:
   const url = '/api/...'
   ```

2. **Deploy Next.js app to Vercel** (includes API routes)

3. **Done!** No need for separate backend

---

## Need Help?

If you're still stuck:

1. **Share Render logs** - Copy error messages from Render dashboard
2. **Share environment variables** - List what env vars are set (hide sensitive values)
3. **Share database provider** - Are you using Render PostgreSQL, Supabase, etc.?
4. **Share backend repo** - If you have a separate backend codebase

I can provide more specific guidance based on the actual errors you're seeing!
