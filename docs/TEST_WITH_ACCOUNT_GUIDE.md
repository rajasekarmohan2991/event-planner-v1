# 🧪 Test with Test Account - Complete Guide

## 🎯 What We're Testing

1. ✅ Email/Password Registration
2. ✅ Email/Password Login
3. ✅ Google Sign-In (after OAuth setup)
4. ✅ Instagram Sign-In (after OAuth setup)
5. ✅ All core features

---

## 🚀 Quick Test (Automated)

### Run the Test Script:
```bash
cd "/Users/rajasekar/Event Planner V1"
./test-with-account.sh
```

**What it does:**
- Checks if services are running
- Tests register page accessibility
- Creates a test account automatically
- Tests login with the test account
- Checks OAuth button visibility
- Provides summary and next steps

---

## 📋 Manual Testing (Step by Step)

### Test 1: Register with Email/Password ✅

1. **Open register page:**
   ```bash
   open http://localhost:3001/auth/register
   ```

2. **Fill in the form:**
   - Name: `Test User`
   - Email: `testuser@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`

3. **Click "Sign Up"**

4. **Expected Result:**
   - ✅ Account created successfully
   - ✅ Redirected to dashboard
   - ✅ User menu visible (top right)
   - ✅ Welcome message

---

### Test 2: Logout and Login ✅

1. **Logout:**
   - Click user menu (top right)
   - Click "Logout"

2. **Login:**
   ```bash
   open http://localhost:3001/auth/login
   ```

3. **Enter credentials:**
   - Email: `testuser@example.com`
   - Password: `TestPassword123!`

4. **Click "Sign In"**

5. **Expected Result:**
   - ✅ Login successful
   - ✅ Redirected to dashboard
   - ✅ User menu visible

---

### Test 3: Test Google Sign-In (Requires OAuth Setup)

**Prerequisites:**
- Google OAuth credentials configured
- See `OAUTH_IMPLEMENTATION_STEPS.md`

1. **Open register page:**
   ```bash
   open http://localhost:3001/auth/register
   ```

2. **Click "Google" button**

3. **Expected Flow:**
   - Redirects to Google OAuth
   - Shows consent screen
   - Lists permissions
   - Shows your test email

4. **Grant permissions**

5. **Expected Result:**
   - ✅ Redirected back to app
   - ✅ Automatically logged in
   - ✅ Account created (if new)
   - ✅ Redirected to dashboard

---

### Test 4: Test Instagram Sign-In (Requires OAuth Setup)

**Prerequisites:**
- Instagram OAuth credentials configured
- See `OAUTH_IMPLEMENTATION_STEPS.md`

1. **Open register page:**
   ```bash
   open http://localhost:3001/auth/register
   ```

2. **Click "Instagram" button**

3. **Expected Flow:**
   - Redirects to Instagram OAuth
   - Shows login screen
   - Shows consent screen

4. **Grant permissions**

5. **Expected Result:**
   - ✅ Redirected back to app
   - ✅ Automatically logged in
   - ✅ Account created (if new)
   - ✅ Redirected to dashboard

---

## 🧪 Testing All Features

After logging in, test these features:

### Test 5: Create an Event

1. **Go to Events:**
   ```bash
   open http://localhost:3001/events
   ```

2. **Click "Create Event"**

3. **Fill in details:**
   - Name: `Test Conference 2024`
   - Type: `Conference`
   - Start Date: [Future date]
   - End Date: [Future date]
   - Location: `Convention Center`

4. **Click "Create"**

5. **Expected Result:**
   - ✅ Event created
   - ✅ Redirected to event details
   - ✅ Event visible in list

---

### Test 6: Configure Registration Settings

1. **Go to Registration Settings:**
   ```bash
   open http://localhost:3001/events/1/registrations/settings
   ```

2. **Toggle settings:**
   - ✅ Registration Approval: ON
   - ✅ Cancellation Approval: ON
   - ✅ Allow Transfer: ON
   - Time Limit: 30 minutes

3. **Click "Save Changes"**

4. **Expected Result:**
   - ✅ Success message
   - ✅ Settings saved
   - ✅ Refresh page - settings persist

---

### Test 7: Send Email Invitations

1. **Go to Communicate:**
   ```bash
   open http://localhost:3001/events/1/communicate
   ```

2. **Send Quick Invite:**
   - Enter emails: `test1@example.com, test2@example.com`
   - Click "Send Invites"

3. **Expected Result:**
   - ✅ Success message
   - ✅ Emails sent
   - ✅ Check console for preview URL

---

### Test 8: Social Sharing

1. **On Communicate page, go to "Social Share" tab**

2. **Test each button:**
   - Click "Copy" → ✅ Link copied
   - Click "Facebook" → ✅ Share dialog opens
   - Click "Twitter" → ✅ Tweet dialog opens
   - Click "LinkedIn" → ✅ Share dialog opens

---

## 🎯 Test Accounts

### Pre-configured Test Accounts:

**Account 1:**
- Email: `test@example.com`
- Password: `password123`
- Role: USER

**Account 2 (Create via script):**
- Email: Generated automatically
- Password: `TestPassword123!`
- Role: USER

**Account 3 (Create manually):**
- Email: Your choice
- Password: Your choice
- Role: USER

---

## 📊 Test Results Checklist

### Authentication:
- [ ] Email/Password registration works
- [ ] Email/Password login works
- [ ] Logout works
- [ ] Password reset works
- [ ] Google sign-in works (if OAuth configured)
- [ ] Instagram sign-in works (if OAuth configured)

### Core Features:
- [ ] Event creation works
- [ ] Event editing works
- [ ] Event publishing works
- [ ] Registration settings work
- [ ] Email invitations work
- [ ] Social sharing works
- [ ] Statistics display correctly

### UI/UX:
- [ ] Pages load quickly (< 3 seconds)
- [ ] No 500 errors
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Loading states show properly
- [ ] Success messages appear

---

## 🐛 Troubleshooting

### Issue: Register page shows 500 error
**Solution:**
```bash
# Check if build completed
docker compose ps

# Check logs
docker compose logs web --tail=20

# Rebuild if needed
docker compose down web
docker compose up web --build -d
```

### Issue: Can't register with email/password
**Solution:**
- Check form validation
- Password must be at least 8 characters
- Email must be valid format
- Check browser console for errors

### Issue: Google/Instagram buttons not visible
**Solution:**
- Wait for build to complete
- Refresh the page (Cmd+Shift+R)
- Clear browser cache
- Check if page loaded completely

### Issue: Google/Instagram buttons don't work
**Solution:**
- OAuth credentials not configured
- Run: `./setup-oauth.sh`
- Follow OAuth setup guide
- Restart application

---

## 📝 Quick Commands

### Check Services:
```bash
docker compose ps
```

### View Logs:
```bash
docker compose logs web --tail=50
docker compose logs web --follow
```

### Restart Services:
```bash
docker compose restart web
```

### Rebuild:
```bash
docker compose down web
docker compose up web --build -d
```

### Run Tests:
```bash
./test-with-account.sh
```

### Check OAuth Status:
```bash
./setup-oauth.sh
# Choose option 3
```

---

## 🎯 Success Criteria

**All tests pass when:**
- ✅ Register page loads (HTTP 200)
- ✅ Can create account with email/password
- ✅ Can login with credentials
- ✅ Can logout
- ✅ Can create events
- ✅ Can configure settings
- ✅ Can send emails
- ✅ Can share on social media
- ✅ Google button visible (if OAuth configured)
- ✅ Instagram button visible (if OAuth configured)
- ✅ No 500 errors
- ✅ No console errors

---

## 🚀 Next Steps After Testing

### If All Tests Pass:
1. ✅ Application is ready!
2. ✅ Can be used for demo
3. ✅ Can onboard real users
4. ✅ (Optional) Set up OAuth for social login

### If Some Tests Fail:
1. Check the troubleshooting section
2. Review error messages
3. Check logs: `docker compose logs web`
4. Rebuild if needed
5. Re-run tests

---

## 📞 Need Help?

### Run Automated Test:
```bash
./test-with-account.sh
```

### Check Status:
```bash
./setup-oauth.sh
# Choose option 4 (Test OAuth setup)
```

### View Guides:
```bash
cat OAUTH_IMPLEMENTATION_STEPS.md
cat ENABLE_SOCIAL_LOGIN.md
```

---

**Ready to test? Run:**
```bash
./test-with-account.sh
```

**Or open in browser:**
```bash
open http://localhost:3001/auth/register
```

**Good luck with testing! 🎉**
