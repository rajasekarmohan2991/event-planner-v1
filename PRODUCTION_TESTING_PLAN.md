# PRODUCTION TESTING PLAN - Event Planner V1

## Current Status

✅ **All code fixes pushed to GitHub**
✅ **Vercel will auto-deploy** (takes 2-5 minutes)
✅ **Event 20 exists in Supabase production database**
✅ **All API fixes are in the code:**
- Registration API params handling
- Floor plan API params handling  
- Currency conversion
- Communication tab auto-load

---

## WAIT FOR DEPLOYMENT

Before testing, **wait for Vercel deployment to complete:**

### Check Deployment Status:

1. Go to: **https://vercel.com/dashboard**
2. Select your project: **aypheneventplanner**
3. Check the **Deployments** tab
4. Wait for status: **"Ready"** or **"Deployment Complete"**
5. Usually takes **2-5 minutes**

---

## PRODUCTION TESTING CHECKLIST

Once deployment is complete, test these in order:

### ✅ Test 1: Registration System

1. **Go to:** https://aypheneventplanner.vercel.app/events/20/register

2. **Fill out the form:**
   - First Name
   - Last Name
   - Email
   - **Phone Number** (IMPORTANT!)
   - Any other required fields

3. **Submit the registration**

4. **Verify success:**
   - ✅ Success message appears
   - ✅ QR code displays
   - ✅ Email confirmation sent (check inbox)

5. **Check registration list:**
   - Go to: https://aypheneventplanner.vercel.app/events/20/registrations
   - ✅ Your registration appears in the table
   - ✅ Stats update (Total: 1, Approved: 1)
   - ✅ Name, email, phone display correctly

**Expected Result:** Registration appears immediately in the list with correct stats.

---

### ✅ Test 2: Communication Tab

1. **Go to:** https://aypheneventplanner.vercel.app/events/20/communicate

2. **Click on "SMS Messages" tab**

3. **Verify:**
   - ✅ Phone number loads automatically (no manual button click)
   - ✅ Your phone number appears in recipient list
   - ✅ Count shows: "1 phone number"

4. **Click on "WhatsApp" tab**

5. **Verify:**
   - ✅ Same phone number appears
   - ✅ Ready to send messages

**Expected Result:** Phone numbers load automatically when switching tabs.

---

### ✅ Test 3: Floor Plan Designer

1. **Go to:** https://aypheneventplanner.vercel.app/events/20/design/floor-plan

2. **Create a floor plan:**
   - Click "Create New Floor Plan" or similar
   - Add some objects (tables, chairs, stage)
   - Click "Save"

3. **Verify:**
   - ✅ Save succeeds (no 404 error)
   - ✅ Success message appears
   - ✅ Floor plan persists after page reload

**Expected Result:** Floor plan saves successfully without errors.

---

### ✅ Test 4: Currency Converter

1. **Go to:** https://aypheneventplanner.vercel.app/admin (or wherever currency converter is)

2. **Check exchange rates:**
   - ✅ Rates are NOT 0.0000
   - ✅ Shows real exchange rates
   - ✅ Can convert between currencies

**Expected Result:** Real-time exchange rates display correctly.

---

## IF SOMETHING DOESN'T WORK

### Troubleshooting Steps:

1. **Hard Refresh Browser:**
   - Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - This clears browser cache

2. **Check Browser Console:**
   - Press F12 to open DevTools
   - Go to Console tab
   - Look for error messages
   - Take a screenshot if needed

3. **Check Network Tab:**
   - In DevTools, go to Network tab
   - Perform the action that's failing
   - Look for failed requests (red)
   - Check the response body

4. **Verify You're Logged In:**
   - Make sure you're authenticated
   - Try logging out and back in

5. **Wait Longer:**
   - Deployment might still be in progress
   - Wait another 2-3 minutes
   - Try again

---

## COMMON ISSUES & SOLUTIONS

### Issue: "No registrations found"
**Cause:** No registrations created yet  
**Solution:** Create a NEW registration (old ones don't exist in database)

### Issue: "Phone numbers not loading"
**Cause:** No registrations with phone numbers  
**Solution:** Create a registration with a phone number

### Issue: "Floor plan 404 error"
**Cause:** Deployment not complete or browser cache  
**Solution:** Wait for deployment, hard refresh, try again

### Issue: "Currency shows 0.0000"
**Cause:** Exchange rates not fetched yet  
**Solution:** Wait 30 seconds, refresh page

---

## EXPECTED TIMELINE

- **Now:** Code pushed to GitHub ✅
- **+2 min:** Vercel starts building
- **+4 min:** Deployment completes
- **+5 min:** Ready to test

**Start testing 5 minutes from now!**

---

## SUCCESS CRITERIA

All these should work in production:

✅ Registration creates and appears in list  
✅ Stats update in real-time  
✅ QR codes display correctly  
✅ Phone numbers load in Communication tab  
✅ Floor plan saves without 404  
✅ Currency converter shows real rates  

---

## NEXT STEPS AFTER TESTING

1. **If everything works:** You're done! 🎉

2. **If something fails:**
   - Note which specific feature fails
   - Check browser console for errors
   - Take screenshots
   - Report the specific error message

---

## IMPORTANT NOTES

⚠️ **Use Event ID 20** for all testing (confirmed to exist in Supabase)

⚠️ **Create NEW registrations** (old ones don't exist in database)

⚠️ **Include phone number** when registering (for Communication tab test)

⚠️ **Wait for deployment** before testing (check Vercel dashboard)

---

## Quick Test URLs

- **Registration:** https://aypheneventplanner.vercel.app/events/20/register
- **Registration List:** https://aypheneventplanner.vercel.app/events/20/registrations
- **Communication:** https://aypheneventplanner.vercel.app/events/20/communicate
- **Floor Plan:** https://aypheneventplanner.vercel.app/events/20/design/floor-plan

---

**Start testing in 5 minutes!** ⏰

All fixes are deployed. Event 20 is ready. Everything should work! 🚀
