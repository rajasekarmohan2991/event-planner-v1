# Testing Guide: Payment & Ticket Class Issues

## ✅ Docker Status: RUNNING

All containers are up and healthy:
- ✅ Web (Next.js): http://localhost:3001
- ✅ API (Java): http://localhost:8081
- ✅ PostgreSQL: Running
- ✅ Redis: Running

---

## Test 1: Payment History Fix ✅

### Issue Fixed:
Payments were not appearing after successful registration.

### Testing Steps:

#### Step 1: Complete Registration
```
1. Open: http://localhost:3001/events/9/register
2. Fill in registration details:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
3. Select ticket type (if applicable)
4. Proceed to payment
5. Select "Dummy Payment" method
6. Complete registration
7. Note the success message
```

#### Step 2: Check Payment History
```
1. Open: http://localhost:3001/events/9/registrations/payments
2. Expected Result:
   ✅ Payment appears in the list
   ✅ Shows correct amount (e.g., ₹500)
   ✅ Shows user name: "Test User"
   ✅ Shows email: test@example.com
   ✅ Shows status: "COMPLETED" or "FREE"
   ✅ Shows payment method: "Dummy"
   ✅ Shows date/time of payment
```

#### Step 3: Verify Payment Details
```
Click on payment row (if expandable) to see:
- Original amount
- Discount (if promo code used)
- Final amount
- Promo code (if applied)
- Payment method details
```

### Expected Result:
✅ **PASS**: Payment appears with all correct details  
❌ **FAIL**: Payment still not showing → Check browser console for errors

---

## Test 2: Ticket Class Edit/Delete ⏳

### Issue Reported:
Edit and Delete buttons not working for individual tickets.

### Testing Steps:

#### Step 1: Access Ticket Class Page
```
1. Open: http://localhost:3001/events/9/registrations/ticket-class
2. You should see:
   - List of ticket groups (e.g., "vvip (5)")
   - Table with ticket details
   - Edit and Delete buttons for each ticket
```

#### Step 2: Test Edit Function
```
1. Click "Edit" button on any ticket
2. Expected: Modal/drawer opens with ticket details
3. Make a change (e.g., change price from ₹0 to ₹100)
4. Click "Save" or "Update"
5. Expected: Modal closes, ticket updates in list
```

**If Edit Fails:**
- Open browser DevTools (F12)
- Go to Console tab
- Click "Edit" again
- Check for error messages
- Share the error message

#### Step 3: Test Delete Function
```
1. Click "Delete" button on any ticket
2. Expected: Confirmation dialog appears
3. Click "OK" or "Confirm"
4. Expected: Ticket is removed from list
```

**If Delete Fails:**
- Open browser DevTools (F12)
- Go to Network tab
- Click "Delete" again
- Find the DELETE request
- Check status code and response
- Share the error details

### Common Issues & Solutions:

#### Issue: 401 Unauthorized
**Cause**: Session expired or not authenticated  
**Solution**: Logout and login again

#### Issue: 404 Not Found
**Cause**: Java API endpoint doesn't exist  
**Solution**: Check Java API logs:
```bash
docker compose logs api --tail 50
```

#### Issue: 500 Internal Server Error
**Cause**: Java API error  
**Solution**: Check Java API logs for stack trace

---

## Test 3: Ticket Duplication Issue ⏳

### Issue Reported:
Creating ticket class with 25 seats creates 5 duplicate "vip" entries.

### Testing Steps:

#### Step 1: Clean Up Duplicates
```
1. Go to: http://localhost:3001/events/9/registrations/ticket-class
2. Delete all duplicate "vip" tickets using Delete button
3. Keep only 1 ticket or delete all
```

#### Step 2: Create New Ticket Class
```
1. Click "+ New Ticket Class" button
2. Fill in details:
   - Name: "Test VIP"
   - Ticket Class: VIP
   - Quantity: 5 (start small to test)
   - Price: ₹1000
   - Status: Open
3. Click "Save" or "Create"
```

#### Step 3: Check Result
```
Expected: 1 ticket created with quantity 5
Actual: Check how many tickets appear

If 1 ticket: ✅ Working correctly
If 5 tickets: ❌ Duplication issue confirmed
```

### If Duplication Occurs:

#### Check 1: Form Submission
```
Open browser DevTools → Network tab
Create ticket again
Count how many POST requests are sent
- 1 request = Frontend issue (multiple submissions)
- 1 request = Backend issue (Java API creating duplicates)
```

#### Check 2: Java API Logs
```bash
docker compose logs api --tail 100 | grep -i "ticket"
```

Look for:
- Multiple "Creating ticket" messages
- Loop or iteration creating multiple tickets
- Error that causes retry

#### Check 3: Database
```bash
# Connect to PostgreSQL
docker exec -it eventplannerv1-postgres-1 psql -U postgres -d eventplanner

# Check tickets table
SELECT id, name, quantity, event_id FROM tickets WHERE event_id = 9 ORDER BY created_at DESC LIMIT 10;

# Exit
\q
```

---

## Debugging Checklist

### For Payment Issue:
- [x] Fixed column names in API
- [x] Docker rebuilt with fix
- [ ] Test registration with payment
- [ ] Verify payment appears in history
- [ ] Check payment details are correct

### For Ticket Edit/Delete:
- [ ] Java API is running (check `docker compose ps`)
- [ ] Access token is valid (try logout/login)
- [ ] Browser console shows no errors
- [ ] Network tab shows successful requests
- [ ] Java API logs show no errors

### For Ticket Duplication:
- [ ] Only 1 POST request sent from frontend
- [ ] Java API logs show single creation
- [ ] Database shows correct number of tickets
- [ ] No triggers or loops creating duplicates

---

## Error Collection Template

If you encounter errors, please provide:

### 1. Browser Console Errors
```
Open DevTools (F12) → Console tab
Copy all red error messages
```

### 2. Network Request Details
```
Open DevTools (F12) → Network tab
Find the failed request
Right-click → Copy → Copy as cURL
```

### 3. Java API Logs
```bash
docker compose logs api --tail 100
```

### 4. Database State
```bash
docker exec -it eventplannerv1-postgres-1 psql -U postgres -d eventplanner -c "SELECT COUNT(*) FROM tickets WHERE event_id = 9;"
```

---

## Quick Commands

### Restart Services
```bash
cd "/Users/rajasekar/Event Planner V1"
docker compose restart
```

### View Logs
```bash
# Web logs
docker compose logs web --tail 50 -f

# API logs
docker compose logs api --tail 50 -f

# All logs
docker compose logs --tail 50 -f
```

### Check Database
```bash
# Connect to PostgreSQL
docker exec -it eventplannerv1-postgres-1 psql -U postgres -d eventplanner

# Check payments
SELECT COUNT(*) FROM payments WHERE event_id = 9;

# Check tickets
SELECT id, name, quantity FROM tickets WHERE event_id = 9;

# Exit
\q
```

---

## Test Results Template

Please fill this out after testing:

### Payment Test:
- [ ] ✅ Payment appears after registration
- [ ] ✅ Amount is correct
- [ ] ✅ User details shown
- [ ] ✅ Status is correct
- [ ] ❌ Still not working → Error: _______________

### Ticket Edit Test:
- [ ] ✅ Edit button opens modal
- [ ] ✅ Can update ticket details
- [ ] ✅ Changes save successfully
- [ ] ❌ Not working → Error: _______________

### Ticket Delete Test:
- [ ] ✅ Delete button shows confirmation
- [ ] ✅ Ticket is removed after confirmation
- [ ] ❌ Not working → Error: _______________

### Ticket Creation Test:
- [ ] ✅ Creates 1 ticket with specified quantity
- [ ] ❌ Creates duplicate tickets → Count: _______________

---

## Summary

### Fixed Issues:
✅ **Payment Not Appearing** - Column names fixed, should work now

### Pending Investigation:
⏳ **Ticket Edit/Delete** - Needs testing with error details  
⏳ **Ticket Duplication** - Needs testing with small quantity

### Next Steps:
1. Test payment history (should work now)
2. Test ticket edit/delete (collect errors if fails)
3. Test ticket creation with quantity 5 (check for duplicates)
4. Share results and any error messages

---

**Testing Environment:**
- Web App: http://localhost:3001
- Java API: http://localhost:8081
- Test Event ID: 9
- Docker Status: ✅ All containers running

**Ready to test!** 🚀
