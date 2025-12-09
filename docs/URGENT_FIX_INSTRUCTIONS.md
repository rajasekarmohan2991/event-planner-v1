# 🚨 URGENT: YOU MUST DO THIS NOW!

## ⚠️ THE PROBLEM:

You're getting **401 Unauthorized** errors because your browser has an **OLD SESSION** without the `accessToken`.

The image preview code is deployed, but you won't see it work until you fix the authentication first.

---

## ✅ SOLUTION (DO THIS NOW):

### Step 1: LOGOUT COMPLETELY

1. Go to: http://localhost:3001
2. Click your profile/avatar in the top right
3. Click "Logout" or "Sign Out"

**OR** manually clear cookies:
- Press `F12` (open DevTools)
- Go to "Application" tab
- Click "Cookies" → "http://localhost:3001"
- Delete ALL cookies
- Close DevTools

---

### Step 2: CLOSE ALL TABS

Close ALL browser tabs for `localhost:3001`

---

### Step 3: FRESH LOGIN

1. Open NEW tab
2. Go to: http://localhost:3001/auth/signin
3. Login with:
   ```
   Email: rbusiness2111@gmail.com
   Password: password123
   ```

---

### Step 4: VERIFY IN LOGS

Open terminal and run:
```bash
cd "/Users/rajasekar/Event Planner V1"
docker compose logs web --tail 30 | grep "accessToken\|Generated"
```

**You MUST see**:
```
🔑 Generated accessToken for: rbusiness2111@gmail.com
🔑 Session has accessToken: eyJzdWIiOiIyIiwiZW...
```

If you DON'T see this, the login didn't work. Try again.

---

### Step 5: TEST EVENT CREATION

1. Go to: http://localhost:3001/events/new
2. Fill in Steps 1-3
3. On Step 4 (Media & Extras):
   - Click "Upload Image"
   - Select a banner image
   - **LOOK AT THE RIGHT SIDEBAR** → Image should appear!
4. Click "Next" → Step 5
5. Click "Submit"

**Expected**:
- ✅ Image shows in sidebar
- ✅ Event creates successfully (NO 401 error!)
- ✅ Redirected to event page

---

## 🔍 TROUBLESHOOTING

### Still Getting 401 After Re-Login?

Check logs:
```bash
docker compose logs web --tail 50 | grep "accessToken"
```

**If you see**: `⚠️  Session missing accessToken!`
- Your session is still old
- Clear cookies again
- Try incognito/private window

**If you see**: `🔑 Session has accessToken: ...`
- Good! Token exists
- But browser might not be sending it
- Hard refresh: `Cmd+Shift+R` or `Ctrl+Shift+R`

---

### Image Still Not Showing in Sidebar?

1. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Check upload success**: Look for green "Banner image uploaded successfully" message
3. **Check browser console** (F12):
   - Look for any errors
   - Check Network tab for failed requests

4. **Verify image uploaded**:
   ```bash
   docker compose exec web ls -la /app/public/uploads/
   ```
   You should see your uploaded image file.

---

## 📊 VERIFICATION COMMANDS

### Check if new code is running:
```bash
docker compose logs web --tail 50 | grep "Generated accessToken"
```

### Check current session:
```bash
docker compose logs web --tail 20 | grep "Session"
```

### Check for errors:
```bash
docker compose logs web --tail 100 | grep -i "error\|401"
```

---

## ⚡ QUICK FIX SUMMARY:

1. **Logout** → Clear cookies
2. **Close all tabs** for localhost:3001
3. **Fresh login** with rbusiness2111@gmail.com
4. **Verify logs** show "Generated accessToken"
5. **Test event creation** → Image should show in sidebar!

---

## 🎯 WHY THIS IS NECESSARY:

The authentication system was updated to generate `accessToken` for API calls. Your old session doesn't have this token, so:
- ❌ Event creation fails with 401
- ❌ API calls are rejected
- ❌ You can't submit events

**After re-login**:
- ✅ New session has `accessToken`
- ✅ API calls work
- ✅ Event creation succeeds
- ✅ Image preview works

---

## 🚀 DO THIS NOW!

**Don't skip the re-login!** It's the ONLY way to get the new `accessToken`.

1. Logout
2. Close tabs
3. Fresh login
4. Check logs
5. Test event creation

**Then everything will work!** 🎉
