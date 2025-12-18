# Critical API Errors - Troubleshooting Guide

## Issues Reported

### 1. Registration Failed After Payment (500 Error)
```
POST /api/events/8/registrations
Status: 500 Internal Server Error
Source: event-planner-v1.onrender.com
```

### 2. Promo Codes Cannot Be Created (400 Error)
```
POST /api/events/8/promo-codes
Status: 400 Bad Request
Source: event-planner-v1.onrender.com
```

---

## Root Cause Analysis

### Issue: External API vs Local API

Your application has **TWO API layers**:

1. **Local Next.js API** (`/apps/web/app/api/`) - ✅ Working correctly
2. **External Backend** (`event-planner-v1.onrender.com`) - ❌ Failing

The errors are coming from the **external backend**, not the local Next.js API.

---

## Solution Options

### Option 1: Use Local API (Recommended)

Update your frontend to use the local Next.js API instead of the external one.

**Current (Failing):**
```typescript
// Calling external API directly
fetch('https://event-planner-v1.onrender.com/api/events/8/registrations', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

**Fixed (Using Local):**
```typescript
// Call local Next.js API which has all the logic
fetch('/api/events/8/registrations', {
  method: 'POST',
  body: JSON.stringify(data)
})
```

---

### Option 2: Fix External Backend

If you need to use the external backend, check:

1. **Backend Service Status**
   - Is `event-planner-v1.onrender.com` running?
   - Check Render.com dashboard for errors
   - Review backend logs

2. **Database Connection**
   - Is the external backend connected to the database?
   - Check connection strings
   - Verify database is accessible

3. **Environment Variables**
   - Are all required env vars set on Render?
   - Database URL
   - API keys
   - JWT secrets

4. **API Compatibility**
   - Does the external API expect different request format?
   - Check request body structure
   - Verify headers

---

## Detailed Error Analysis

### Registration 500 Error

**Possible Causes:**
1. Database connection failed
2. Missing required fields in request
3. Payment processing error
4. Email service failure
5. Transaction rollback

**Debug Steps:**
```bash
# Check Render logs
1. Go to Render.com dashboard
2. Select event-planner-v1 service
3. View logs tab
4. Look for errors around the time of registration attempt

# Check request payload
1. Open browser DevTools (F12)
2. Go to Network tab
3. Find the failed request
4. Check "Payload" tab
5. Verify all required fields are present
```

**Required Fields for Registration:**
```json
{
  "data": {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "totalPrice": 1000,
    "paymentMethod": "CARD",
    "selectedSeats": []
  },
  "type": "VIRTUAL"
}
```

---

### Promo Code 400 Error

**Possible Causes:**
1. Missing required fields
2. Invalid discount type
3. Invalid amount format
4. Duplicate promo code
5. Database schema mismatch

**Debug Steps:**
```bash
# Check what's being sent
1. Open browser DevTools
2. Network tab
3. Find POST to /promo-codes
4. Check request payload
```

**Required Fields for Promo Code:**
```json
{
  "code": "SAVE20",
  "discountType": "PERCENTAGE",
  "discountAmount": 20,
  "maxUses": 100,
  "maxUsesPerUser": 1,
  "minOrderAmount": 0,
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-12-31T23:59:59Z",
  "isActive": true,
  "description": "20% off"
}
```

**Common Validation Errors:**
- `code` is empty or null
- `discountAmount` is not a number
- `discountType` is not "PERCENTAGE" or "FIXED"
- Dates are in wrong format

---

## Quick Fix: Switch to Local API

### Step 1: Find Frontend Code Making External Calls

Search for:
```bash
grep -r "event-planner-v1.onrender.com" apps/web/
```

### Step 2: Replace with Relative URLs

**Before:**
```typescript
const response = await fetch('https://event-planner-v1.onrender.com/api/events/8/registrations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

**After:**
```typescript
const response = await fetch('/api/events/8/registrations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

### Step 3: Update Environment Variables

If using env vars for API base URL:

**.env.local:**
```bash
# Comment out external API
# NEXT_PUBLIC_API_BASE_URL=https://event-planner-v1.onrender.com

# Use local API
NEXT_PUBLIC_API_BASE_URL=
```

---

## Testing After Fix

### Test Registration:
```bash
# 1. Open browser DevTools
# 2. Go to registration page
# 3. Fill out form
# 4. Submit
# 5. Check Network tab - should call /api/events/[id]/registrations (local)
# 6. Should return 201 with registration data
```

### Test Promo Code:
```bash
# 1. Go to event settings → Promo Codes
# 2. Create new promo code
# 3. Check Network tab - should call /api/events/[id]/promo-codes (local)
# 4. Should return 201 with promo code data
```

---

## Verification Checklist

After implementing fixes:

- [ ] Registration completes successfully
- [ ] Payment is recorded
- [ ] Confirmation email is sent
- [ ] QR code is generated
- [ ] Promo codes can be created
- [ ] Promo codes can be applied
- [ ] Discount is calculated correctly
- [ ] No 500 or 400 errors in console

---

## Local API Endpoints (Working)

All these endpoints are implemented and working in your Next.js app:

### Registrations:
- ✅ `GET /api/events/[id]/registrations` - List registrations
- ✅ `POST /api/events/[id]/registrations` - Create registration
- ✅ `GET /api/events/[id]/registrations/[registrationId]` - Get details
- ✅ `PUT /api/events/[id]/registrations/[registrationId]` - Update
- ✅ `POST /api/events/[id]/registrations/[registrationId]/approve` - Approve
- ✅ `POST /api/events/[id]/registrations/[registrationId]/cancel` - Cancel

### Promo Codes:
- ✅ `GET /api/events/[id]/promo-codes` - List promo codes
- ✅ `POST /api/events/[id]/promo-codes` - Create promo code
- ✅ `PUT /api/events/[id]/promo-codes/[codeId]` - Update
- ✅ `DELETE /api/events/[id]/promo-codes/[codeId]` - Delete
- ✅ `POST /api/events/[id]/promo-codes/validate` - Validate code
- ✅ `POST /api/events/[id]/promo-codes/apply` - Apply discount

---

## Next Steps

1. **Immediate:** Switch frontend to use local API (`/api/...` instead of full URL)
2. **Short-term:** Test all functionality with local API
3. **Long-term:** Either:
   - Keep using local Next.js API (simpler, faster)
   - OR fix external backend and use it consistently
   - Don't mix both - choose one approach

---

## Need Help?

If issues persist after switching to local API:

1. Share browser console errors
2. Share Network tab request/response
3. Share server logs from terminal
4. Provide exact steps to reproduce

The local API has comprehensive error handling and logging, making debugging much easier!
