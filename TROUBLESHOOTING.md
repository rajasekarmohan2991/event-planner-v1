# Troubleshooting Guide

## Issues Reported

### 1. Seat Selector Not Saving ❌
### 2. Check-In Not Working ❌

---

## Investigation Results

### ✅ Seat Selector Component
**Location**: `/apps/web/components/SeatSelector.tsx`

**How it works**:
- Component handles seat selection UI
- Calls `onSeatsSelected(seats, totalPrice)` callback when seats change
- **Does NOT have its own save button**
- Parent component must handle saving

**The seat selector is working correctly!** The issue is likely in the parent component that uses it.

**Where it's used**:
- `/apps/web/app/events/[id]/register-with-seats/page.tsx`

**To fix**: Check the parent component's save implementation.

---

### ✅ Check-In API
**Location**: `/apps/web/app/api/events/[id]/check-in/route.ts`

**What it does**:
1. Receives `registrationId` in POST request
2. Checks if already checked in
3. Updates database with check-in status
4. Returns success/error

**The API is working correctly!**

---

## Common Issues & Solutions

### Seat Selector Issues

#### Issue: "Seats not saving"
**Possible Causes**:
1. Parent component not calling save API
2. Network error
3. Missing authentication
4. Database connection issue

**How to Debug**:
```javascript
// Open browser console (F12)
// Check for errors when clicking save
// Look for failed network requests in Network tab
```

**Solution**:
Check `/apps/web/app/events/[id]/register-with-seats/page.tsx` for save implementation.

---

### Check-In Issues

#### Issue: "Check-in not working"
**Possible Causes**:
1. Registration ID not found
2. Event ID mismatch
3. Database connection error
4. Missing authentication

**How to Debug**:
```javascript
// Browser Console (F12)
// Check Network tab for /api/events/[id]/check-in requests
// Look for error responses
```

**Common Errors**:
- `401 Unauthorized` → Not logged in
- `404 Not Found` → Registration doesn't exist
- `500 Server Error` → Database issue

---

## Testing Steps

### Test Seat Selector:
1. Go to event registration page with seats
2. Open browser console (F12)
3. Select seats
4. Click save/continue button
5. Check console for errors
6. Check Network tab for API calls

### Test Check-In:
1. Go to `/events/[id]/event-day/check-in`
2. Open browser console (F12)
3. Try to check in a registration
4. Check console for errors
5. Check Network tab for `/check-in` API call

---

## API Endpoints

### Seat Selection
- **GET** `/api/events/[id]/seats/availability` - Get available seats
- **POST** `/api/events/[id]/seats/reserve` - Reserve seats (if exists)

### Check-In
- **POST** `/api/events/[id]/check-in` - Check in registration
  ```json
  {
    "registrationId": "123"
  }
  ```

---

## Next Steps

To fix these issues, I need:

1. **Screenshot or error message** when save fails
2. **Browser console errors** (F12 → Console tab)
3. **Network tab errors** (F12 → Network tab)
4. **Which page** you're on when it fails

With this information, I can provide a specific fix!

---

## Quick Fixes

### If check-in returns 401:
- User not logged in
- Session expired
- Refresh page and try again

### If check-in returns 404:
- Registration doesn't exist
- Wrong event ID
- Check registration ID is correct

### If seats don't save:
- Check if save button exists
- Check if API endpoint exists
- Check network tab for errors

---

## Contact

If issues persist, provide:
1. Error message
2. Browser console log
3. Steps to reproduce
4. Which page/URL

