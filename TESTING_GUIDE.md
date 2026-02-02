# Testing Guide - Seat Selector & Check-In

## 🎯 Purpose
This guide helps you test and debug seat selector and check-in functionality with detailed console logging.

---

## 📋 Prerequisites

### Before Testing:
1. Open your browser (Chrome/Firefox recommended)
2. Press **F12** to open Developer Tools
3. Click on the **Console** tab
4. Keep it open while testing

---

## 🪑 Test 1: Seat Selector

### Steps to Test:
1. **Navigate to Event Registration**
   ```
   Go to: /events/[event-id]/register-with-seats
   ```

2. **Open Console** (F12 → Console tab)

3. **Select Seats**
   - Click on available seats
   - Watch console for logs starting with `🪑 [SEAT RESERVE]`

4. **Click "Reserve Seats" or "Continue"**

5. **Check Console Output**

### Expected Console Logs:
```
🪑 [SEAT RESERVE] Starting seat reservation process...
🪑 [SEAT RESERVE] Selected seats: [...]
🪑 [SEAT RESERVE] Number of seats: 2
🪑 [SEAT RESERVE] Loading state set to true
🪑 [SEAT RESERVE] Seat IDs to reserve: ["123", "456"]
🪑 [SEAT RESERVE] API endpoint: /api/events/1/seats/reserve
🪑 [SEAT RESERVE] Response status: 200
🪑 [SEAT RESERVE] Response OK: true
✅ [SEAT RESERVE] Success! Response data: {...}
✅ [SEAT RESERVE] Expiry time: 2024-...
✅ [SEAT RESERVE] Reservation ID: 789
✅ [SEAT RESERVE] Moving to step 2 (details)
🪑 [SEAT RESERVE] Loading state set to false
```

### If It Fails:
Look for logs starting with `❌`:
```
❌ [SEAT RESERVE] No seats selected!
❌ [SEAT RESERVE] Failed! Error: {...}
❌ [SEAT RESERVE] Exception caught: ...
```

### Common Issues:

#### Issue: "No seats selected"
**Cause**: Seats not being tracked in state
**Solution**: Check if seats are highlighted when clicked

#### Issue: "Failed to reserve seats"
**Cause**: API error
**Solution**: Check the error message in console

#### Issue: "Network error"
**Cause**: API endpoint doesn't exist or server down
**Solution**: Check Network tab for failed requests

---

## ✅ Test 2: Check-In

### Steps to Test:
1. **Navigate to Check-In Page**
   ```
   Go to: /events/[event-id]/event-day/check-in
   ```

2. **Open Console** (F12 → Console tab)

3. **Try to Check In**
   - Click check-in button for a registration
   - OR scan a QR code

4. **Check Console Output**

### Expected Console Logs:
```
✅ [CHECK-IN] Starting check-in process...
✅ [CHECK-IN] Registration ID: 123
✅ [CHECK-IN] From scanner: false
✅ [CHECK-IN] Event ID: 1
✅ [CHECK-IN] Found registration: {...}
✅ [CHECK-IN] Registration details: {id: "123", name: "John Doe", status: "PENDING"}
✅ [CHECK-IN] Sending API request...
✅ [CHECK-IN] API endpoint: /api/events/1/check-in
✅ [CHECK-IN] Request body: {registrationId: "123"}
✅ [CHECK-IN] Response status: 200
✅ [CHECK-IN] Response OK: true
✅ [CHECK-IN] Success! Response data: {...}
✅ [CHECK-IN] Updated registration status in state
```

### If It Fails:
Look for logs starting with `❌` or `⚠️`:
```
❌ [CHECK-IN] Registration not found in list!
❌ [CHECK-IN] Failed! Status: 404
❌ [CHECK-IN] Exception caught: ...
⚠️ [CHECK-IN] Already checked in!
```

### Common Issues:

#### Issue: "Registration not found"
**Cause**: Registration doesn't exist or wrong ID
**Solution**: Check available registration IDs in console

#### Issue: "Already checked in"
**Cause**: Registration was already checked in
**Solution**: This is expected behavior, not an error

#### Issue: "Failed! Status: 401"
**Cause**: Not authenticated
**Solution**: Log in again

#### Issue: "Failed! Status: 404"
**Cause**: Registration doesn't exist in database
**Solution**: Check registration ID is correct

---

## 🔍 How to Read Console Logs

### Log Prefixes:
- `🪑 [SEAT RESERVE]` - Seat reservation process
- `✅ [CHECK-IN]` - Check-in process (success)
- `❌` - Error occurred
- `⚠️` - Warning (not critical)

### Important Information to Note:
1. **Request Details**
   - API endpoint
   - Request body
   - Event ID

2. **Response Details**
   - Status code (200 = success, 400/500 = error)
   - Response data
   - Error messages

3. **State Changes**
   - Loading states
   - Step changes
   - Status updates

---

## 📸 How to Share Logs

### If You Find an Issue:

1. **Take Screenshot**
   - Include the entire console output
   - Show the error messages

2. **Copy Console Text**
   - Right-click in console
   - Select "Save as..."
   - OR copy relevant error messages

3. **Share These Details**:
   - What you were trying to do
   - Which page you were on
   - Full console output
   - Any error messages shown on screen

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path - Seat Reservation
```
1. Go to event registration page
2. Select 2 seats
3. Click "Reserve Seats"
4. Should move to details form
5. Fill details
6. Complete payment
7. Should see success page
```

### Scenario 2: Happy Path - Check-In
```
1. Go to check-in page
2. Find a pending registration
3. Click "Check In"
4. Should see success message
5. Status should update to "Checked In"
```

### Scenario 3: Error - No Seats Selected
```
1. Go to event registration page
2. Don't select any seats
3. Click "Reserve Seats"
4. Should see error: "Please select at least one seat"
```

### Scenario 4: Error - Already Checked In
```
1. Go to check-in page
2. Find an already checked-in registration
3. Try to check in again
4. Should see: "Already checked in"
```

---

## 🆘 Getting Help

### If Issues Persist:

**Share with me:**
1. Console logs (full output)
2. Network tab errors (F12 → Network)
3. Screenshots
4. Steps you followed
5. Which page/URL

**I'll need:**
- Browser console output
- Network request/response
- Error messages
- Page URL

---

## 📊 Network Tab Debugging

### How to Check Network Requests:

1. **Open Network Tab**
   ```
   F12 → Network tab
   ```

2. **Perform Action**
   - Reserve seats OR check-in

3. **Find Request**
   - Look for `/seats/reserve` or `/check-in`
   - Red = failed, Black = success

4. **Click on Request**
   - Check "Headers" tab for request details
   - Check "Response" tab for error message
   - Check "Preview" tab for formatted response

### What to Look For:
- **Status Code**: 200 (success), 400/500 (error)
- **Request Payload**: Data sent to server
- **Response**: Server's response
- **Error Messages**: In response body

---

## ✅ Success Indicators

### Seat Reservation Success:
- ✅ Console shows "Success! Response data"
- ✅ Page moves to step 2 (details form)
- ✅ Timer starts counting down
- ✅ No error alerts

### Check-In Success:
- ✅ Console shows "Success! Response data"
- ✅ Toast message: "Checked in [Name]"
- ✅ Status changes to "CHECKED_IN"
- ✅ Row highlights in green

---

## 🎯 Next Steps

After testing:
1. Share console logs if errors occur
2. Note which scenario failed
3. Provide screenshots
4. I'll provide specific fixes!

