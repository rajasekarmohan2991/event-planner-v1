# Registration Failing - Troubleshooting Guide

## Issue: Registration Still Failing

I've added comprehensive logging to help diagnose the exact issue. Follow these steps:

---

## Step 1: Check Browser Console

1. Open the registration page
2. Press **F12** (or **Cmd+Option+I** on Mac)
3. Go to **Console** tab
4. Try to register
5. Look for these logs:

### What to Look For:

**Before submission:**
```
📝 Submitting registration: {
  eventId: "8",
  email: "user@example.com",
  amount: 1000,
  promoCode: null
}
```

**After submission:**
```
📡 Registration response: 400 Bad Request
❌ Registration failed: Missing required fields: email, firstName, and lastName are required
```

---

## Step 2: Check Server Logs (Vercel)

1. Go to https://vercel.com
2. Select your project
3. Go to **Deployments** → Latest deployment
4. Click **View Function Logs**
5. Look for:

```
📥 Registration API received: {
  eventId: "8",
  hasSession: true,
  parsedKeys: ["type", "email", "phone", "data"],
  formDataKeys: ["email", "phone", "name"],  ← Check this!
  email: "user@example.com",
  firstName: undefined,  ← Missing!
  lastName: undefined    ← Missing!
}
```

---

## Common Issues & Fixes

### Issue 1: Missing firstName/lastName

**Problem:** Form sends `name` instead of `firstName` and `lastName`

**Check in console:**
```
receivedFields: ["email", "phone", "name"]  ← Wrong!
Should be: ["email", "phone", "firstName", "lastName"]
```

**Fix:** Update registration form to send correct field names

**Where to fix:** `/apps/web/app/events/[id]/register/page.tsx`

```typescript
// Find the registration submission (around line 427)
body: JSON.stringify({ 
  type: 'GENERAL', 
  email: formData.email,
  phone: formData.phone,
  data: {
    ...formData,
    firstName: formData.firstName || formData.name?.split(' ')[0],  // ← Add this
    lastName: formData.lastName || formData.name?.split(' ')[1] || '' // ← Add this
  }
})
```

---

### Issue 2: Data Structure Wrong

**Problem:** Data is nested incorrectly

**Check in logs:**
```
parsedKeys: ["data"]
formDataKeys: []  ← Empty! Data is nested too deep
```

**Fix:** The API expects `data` to contain the form fields

**Current structure (Wrong):**
```json
{
  "data": {
    "data": {
      "email": "...",
      "firstName": "..."
    }
  }
}
```

**Should be:**
```json
{
  "data": {
    "email": "...",
    "firstName": "...",
    "lastName": "..."
  }
}
```

---

### Issue 3: Session Not Available

**Check in logs:**
```
hasSession: false  ← Problem!
```

**Fix:** User needs to be logged in or session needs to be optional

**Update API:** Make session optional for public registrations

```typescript
// In /apps/web/app/api/events/[id]/registrations/route.ts
// Line 136: Change from:
const session = await getServerSession(authOptions as any)
// To:
const session = await getServerSession(authOptions as any) // Optional for public events
```

---

### Issue 4: Event ID Invalid

**Check in logs:**
```
eventId: "undefined"  ← Problem!
```

**Fix:** Event ID not being passed correctly

**Check:** URL should be `/events/8/register` not `/events/undefined/register`

---

## Step 3: Test with Curl

Test the API directly to isolate frontend vs backend issues:

```bash
curl -X POST http://localhost:3001/api/events/8/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "phone": "+1234567890"
    },
    "type": "VIRTUAL"
  }'
```

**Expected:** 201 Created with registration data
**If 400:** Check error message for missing fields

---

## Step 4: Check Form Data

Add this to the registration form to see what's being sent:

```typescript
// In /apps/web/app/events/[id]/register/page.tsx
// Before the fetch call (around line 420)

console.log('Form data being sent:', {
  type: 'GENERAL',
  email: formData.email,
  phone: formData.phone,
  data: formData
})

// Check if firstName and lastName exist
console.log('Has firstName?', !!formData.firstName)
console.log('Has lastName?', !!formData.lastName)
console.log('All form fields:', Object.keys(formData))
```

---

## Quick Fix: Update Registration Form

The most likely issue is the form field names. Here's the fix:

**File:** `/apps/web/app/events/[id]/register/page.tsx`

**Find this code (around line 427):**
```typescript
body: JSON.stringify({ 
  type: 'GENERAL', 
  email: formData.email,
  phone: formData.phone,
  ticketId: 'general',
  priceInr: finalAmount,
  promoCode: promoDiscount?.code,
  data: formData 
})
```

**Replace with:**
```typescript
body: JSON.stringify({ 
  type: 'GENERAL', 
  email: formData.email,
  phone: formData.phone,
  ticketId: 'general',
  priceInr: finalAmount,
  promoCode: promoDiscount?.code,
  data: {
    ...formData,
    // Ensure firstName and lastName are present
    firstName: formData.firstName || formData.name?.split(' ')[0] || 'Guest',
    lastName: formData.lastName || formData.name?.split(' ')[1] || 'User',
    email: formData.email,
    phone: formData.phone
  }
})
```

---

## What I've Added

✅ **Detailed logging** in registration API
✅ **Error messages** show what fields are missing
✅ **Console logs** show what data is received
✅ **Field validation** with helpful error messages

---

## Next Steps

1. **Try to register again**
2. **Check browser console** for logs
3. **Share the error message** you see
4. **Share the console logs** showing what data is being sent

With the new logging, I can see exactly what's wrong and provide a precise fix!

---

## Example of What to Share

When you try to register, copy and share:

**Browser Console:**
```
📝 Submitting registration: { ... }
📡 Registration response: 400 Bad Request
❌ Registration failed: Missing required fields...
```

**Error Alert:**
```
Registration failed: Missing required fields: email, firstName, and lastName are required
Received: ["email", "phone", "name"]
```

This will tell me exactly what fields are missing and how to fix it!
