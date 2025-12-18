# Dual API Setup - External + Internal APIs Working Together

## Overview

Your application now supports **BOTH** external (Render) and internal (Next.js) APIs simultaneously with automatic fallback!

---

## How It Works

### **Smart Fallback System:**

1. **Try External API First** (Render backend)
   - Timeout: 8 seconds
   - If successful → Use response ✅
   - If fails → Automatically fallback to internal

2. **Fallback to Internal API** (Next.js)
   - Timeout: 30 seconds
   - Always works as backup ✅

---

## Usage

### **Option 1: Use Dual API Client (Recommended)**

```typescript
import { dualApi } from '@/lib/dual-api-client'

// GET request
const events = await dualApi.get('/events')

// POST request
const registration = await dualApi.post('/events/8/registrations', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe'
})

// PUT request
const updated = await dualApi.put('/events/8', { title: 'New Title' })

// PATCH request
const patched = await dualApi.patch('/events/8/sponsors', { status: 'active' })

// DELETE request
await dualApi.delete('/events/8/sponsors/123')
```

### **Option 2: Keep Using Existing API Client**

Your existing code continues to work! The old `api` client from `api-client.ts` still works.

---

## Configuration

### **Environment Variables**

Add to `.env.local`:

```bash
# External API (Render backend)
NEXT_PUBLIC_API_BASE_URL=https://event-planner-v1.onrender.com

# Enable/disable external API (default: true)
NEXT_PUBLIC_USE_EXTERNAL_API=true
```

### **Disable External API**

To use ONLY internal API:

```bash
NEXT_PUBLIC_USE_EXTERNAL_API=false
```

---

## Migration Guide

### **Update Your Components**

**Before:**
```typescript
const res = await fetch('/api/events/8/registrations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

**After (with dual API):**
```typescript
import { dualApi } from '@/lib/dual-api-client'

const res = await dualApi.post('/events/8/registrations', data)
```

---

## Benefits

### **1. Redundancy** ✅
- If external API is down → Internal API takes over
- Zero downtime for users

### **2. Performance** ✅
- External API is tried first (faster if Render is healthy)
- Automatic fallback if slow or down

### **3. Development** ✅
- Works locally without external API
- Works in production with both

### **4. Monitoring** ✅
- Console logs show which API is being used
- Easy to debug issues

---

## Console Logs

You'll see helpful logs in the browser console:

```
🌐 Trying external API: https://event-planner-v1.onrender.com/api/events/8/registrations
✅ External API success: 201

OR

🌐 Trying external API: https://event-planner-v1.onrender.com/api/events/8/registrations
⚠️ External API error: timeout, falling back to internal
🏠 Using internal API: /api/events/8/registrations
✅ Internal API success: 201
```

---

## API Endpoints Supported

All your existing endpoints work with dual API:

### **Events:**
- `GET /events` - List events
- `GET /events/[id]` - Get event details
- `POST /events` - Create event
- `PUT /events/[id]` - Update event
- `DELETE /events/[id]` - Delete event

### **Registrations:**
- `GET /events/[id]/registrations` - List registrations
- `POST /events/[id]/registrations` - Create registration ✅
- `GET /events/[id]/registrations/[regId]` - Get details
- `PUT /events/[id]/registrations/[regId]` - Update
- `POST /events/[id]/registrations/[regId]/approve` - Approve
- `POST /events/[id]/registrations/[regId]/cancel` - Cancel

### **Promo Codes:**
- `GET /events/[id]/promo-codes` - List promo codes
- `POST /events/[id]/promo-codes` - Create promo code ✅
- `PUT /events/[id]/promo-codes/[codeId]` - Update
- `DELETE /events/[id]/promo-codes/[codeId]` - Delete
- `POST /events/[id]/promo-codes/validate` - Validate
- `POST /events/[id]/promo-codes/apply` - Apply discount

### **Feed:**
- `GET /feed` - Get feed posts
- `POST /feed` - Create post
- `POST /feed/[postId]/like` - Like post
- `GET /feed/[postId]/comments` - Get comments
- `POST /feed/[postId]/comments` - Add comment

### **Notifications:**
- `GET /notifications` - Get notifications
- `POST /notifications` - Create notification
- `POST /notifications/[id]/read` - Mark as read

---

## Error Handling

The dual API client handles errors intelligently:

### **Client Errors (4xx):**
- Thrown immediately, no retry
- Example: 400 Bad Request, 404 Not Found

### **Server Errors (5xx):**
- Retries with internal API
- Example: 500 Internal Server Error

### **Timeout:**
- External: 8 seconds
- Internal: 30 seconds
- Automatic fallback on timeout

---

## Testing

### **Test External API:**
```typescript
import { dualApi, apiConfig } from '@/lib/dual-api-client'

console.log('External API:', apiConfig.external)
console.log('Use external first:', apiConfig.useExternalFirst)

// This will try external first
const data = await dualApi.get('/events')
```

### **Test Internal API Only:**
```bash
# Set in .env.local
NEXT_PUBLIC_USE_EXTERNAL_API=false
```

### **Test Fallback:**
1. Turn off Render backend
2. Make API call
3. Should automatically use internal API

---

## Deployment

### **Vercel (Frontend):**

Add environment variables:
```bash
NEXT_PUBLIC_API_BASE_URL=https://event-planner-v1.onrender.com
NEXT_PUBLIC_USE_EXTERNAL_API=true
```

### **Render (Backend):**

No changes needed! Your external API continues to work.

---

## Monitoring

### **Check Which API is Being Used:**

```typescript
import { apiConfig } from '@/lib/dual-api-client'

console.log('API Configuration:', apiConfig)
// {
//   external: 'https://event-planner-v1.onrender.com',
//   internal: '/api',
//   useExternalFirst: true,
//   externalTimeout: 8000,
//   internalTimeout: 30000
// }
```

### **Track API Performance:**

All requests are logged to console:
- 🌐 = Trying external API
- ✅ = Success
- ⚠️ = Warning/Fallback
- ❌ = Error
- 🏠 = Using internal API

---

## Troubleshooting

### **Issue: Always using internal API**

**Check:**
1. Is `NEXT_PUBLIC_API_BASE_URL` set?
2. Is `NEXT_PUBLIC_USE_EXTERNAL_API` set to `false`?
3. Is Render backend running?

**Solution:**
```bash
# In .env.local
NEXT_PUBLIC_API_BASE_URL=https://event-planner-v1.onrender.com
NEXT_PUBLIC_USE_EXTERNAL_API=true
```

### **Issue: External API timing out**

**Check:**
1. Is Render backend healthy?
2. Check Render logs for errors

**Solution:**
- Increase timeout (edit `dual-api-client.ts`)
- Or disable external API temporarily

### **Issue: Getting CORS errors**

**Solution:**
Add CORS headers to Render backend:
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
})
```

---

## Best Practices

### **1. Use Dual API for Critical Endpoints**

```typescript
// Registration (critical)
import { dualApi } from '@/lib/dual-api-client'
const registration = await dualApi.post('/events/8/registrations', data)
```

### **2. Use Internal API for Admin Features**

```typescript
// Admin dashboard (internal only is fine)
import { api } from '@/lib/api-client'
const stats = await api.get('/admin/stats')
```

### **3. Handle Errors Gracefully**

```typescript
try {
  const data = await dualApi.post('/events/8/registrations', formData)
  // Success!
} catch (error) {
  if (error instanceof ApiError) {
    alert(`Registration failed: ${error.message}`)
  } else {
    alert('Network error. Please try again.')
  }
}
```

---

## Summary

✅ **External API** (Render) - Tried first, 8s timeout
✅ **Internal API** (Next.js) - Automatic fallback, 30s timeout
✅ **Smart Error Handling** - Client errors don't retry
✅ **Console Logging** - Easy debugging
✅ **Zero Configuration** - Works out of the box
✅ **Backward Compatible** - Existing code still works

**Your APIs now work together seamlessly!** 🎉

Users get:
- Faster responses when external API is healthy
- Automatic fallback when external API is down
- Zero downtime experience
