# 🚀 OAuth Implementation - Step by Step

## ✅ What I've Done For You

1. ✅ **Restored Google & Instagram buttons** in the register form
2. ✅ **Fixed component errors** that were preventing the page from loading
3. ✅ **Created helper script** (`setup-oauth.sh`) to automate credential setup
4. ✅ **Configured OAuth providers** in NextAuth to support Google & Instagram
5. ✅ **Added environment variable placeholders** in `.env.local`
6. 🔄 **Currently rebuilding** the application

---

## 📋 What You Need to Do (Manual Steps)

### Option 1: Use the Helper Script (Easiest) ⭐

```bash
cd "/Users/rajasekar/Event Planner V1"
./setup-oauth.sh
```

**The script will:**
- Check current OAuth status
- Guide you through getting credentials
- Automatically update `.env.local`
- Tell you when to restart the app

---

### Option 2: Manual Setup (Step by Step)

## 🔐 Google OAuth Setup (10 minutes)

### Step 1: Open Google Cloud Console

```bash
# Open this URL in your browser:
open https://console.cloud.google.com/
```

Or manually go to: https://console.cloud.google.com/

---

### Step 2: Create a New Project

1. Click the project dropdown (top left)
2. Click "NEW PROJECT"
3. Enter project name: `Event Planner`
4. Click "CREATE"
5. Wait 30 seconds for creation

---

### Step 3: Enable Required APIs

```bash
# Open this URL:
open https://console.cloud.google.com/apis/library
```

1. Search for "Google+ API"
2. Click on it
3. Click "ENABLE"

---

### Step 4: Configure OAuth Consent Screen

```bash
# Open this URL:
open https://console.cloud.google.com/apis/credentials/consent
```

1. Select "External" user type
2. Click "CREATE"
3. Fill in:
   - App name: `Event Planner`
   - User support email: Your email
   - Developer contact: Your email
4. Click "SAVE AND CONTINUE"
5. On Scopes page, click "ADD OR REMOVE SCOPES"
6. Select:
   - ✅ `.../auth/userinfo.email`
   - ✅ `.../auth/userinfo.profile`
7. Click "UPDATE" → "SAVE AND CONTINUE"
8. On Test users page, click "ADD USERS"
9. Add your email address
10. Click "SAVE AND CONTINUE"
11. Review and click "BACK TO DASHBOARD"

---

### Step 5: Create OAuth Credentials

```bash
# Open this URL:
open https://console.cloud.google.com/apis/credentials
```

1. Click "CREATE CREDENTIALS"
2. Select "OAuth client ID"
3. Application type: "Web application"
4. Name: `Event Planner Web`
5. **Authorized JavaScript origins:**
   ```
   http://localhost:3001
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:3001/api/auth/callback/google
   ```
7. Click "CREATE"
8. **IMPORTANT**: Copy both:
   - Client ID (looks like: `123456789-abc...apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-abc...xyz`)

---

### Step 6: Update Environment Variables

**Option A: Use the helper script**
```bash
./setup-oauth.sh
# Choose option 1 (Set up Google OAuth)
# Paste your credentials when prompted
```

**Option B: Manual edit**
```bash
# Open .env.local
nano apps/web/.env.local

# Find these lines and replace with your credentials:
GOOGLE_CLIENT_ID=paste-your-client-id-here
GOOGLE_CLIENT_SECRET=paste-your-client-secret-here

# Save: Ctrl+O, Enter, Ctrl+X
```

---

### Step 7: Restart Application

```bash
docker compose restart web
```

---

### Step 8: Test Google Sign-In ✅

```bash
# Open register page
open http://localhost:3001/auth/register
```

1. You should see the "Google" button
2. Click it
3. Google OAuth screen should appear
4. Select your account
5. Grant permissions
6. You should be redirected back and logged in!

---

## 📸 Instagram OAuth Setup (15 minutes)

### Step 1: Open Facebook Developers

```bash
# Open this URL:
open https://developers.facebook.com/apps/
```

---

### Step 2: Create Facebook App

1. Click "Create App"
2. Select "Consumer" as app type
3. Click "Next"
4. Fill in:
   - App name: `Event Planner`
   - Contact email: Your email
5. Click "Create App"
6. Complete security check

---

### Step 3: Add Instagram Basic Display

1. In your app dashboard, scroll to "Add Products"
2. Find "Instagram Basic Display"
3. Click "Set Up"
4. Click "Create New App"
5. Display Name: `Event Planner`
6. Click "Create App"

---

### Step 4: Configure Instagram App

1. Go to "Basic Display" settings
2. Fill in:
   - **Valid OAuth Redirect URIs:**
     ```
     http://localhost:3001/api/auth/callback/instagram
     ```
   - **Deauthorize Callback URL:**
     ```
     http://localhost:3001/api/auth/deauthorize
     ```
   - **Data Deletion Request URL:**
     ```
     http://localhost:3001/api/auth/delete
     ```
3. Click "Save Changes"
4. **Copy credentials:**
   - Instagram App ID
   - Instagram App Secret (click "Show")

---

### Step 5: Add Test Users

1. Scroll to "User Token Generator"
2. Click "Add Instagram Testers"
3. Enter your Instagram username
4. Go to Instagram app
5. Settings → Apps and Websites → Tester Invites
6. Accept the invitation

---

### Step 6: Update Environment Variables

**Option A: Use the helper script**
```bash
./setup-oauth.sh
# Choose option 2 (Set up Instagram OAuth)
# Paste your credentials when prompted
```

**Option B: Manual edit**
```bash
nano apps/web/.env.local

# Find these lines and replace:
INSTAGRAM_CLIENT_ID=paste-your-app-id-here
INSTAGRAM_CLIENT_SECRET=paste-your-app-secret-here

# Save: Ctrl+O, Enter, Ctrl+X
```

---

### Step 7: Restart Application

```bash
docker compose restart web
```

---

### Step 8: Test Instagram Sign-In ✅

```bash
open http://localhost:3001/auth/register
```

1. You should see the "Instagram" button
2. Click it
3. Instagram OAuth screen should appear
4. Log in with your test account
5. Grant permissions
6. You should be redirected back and logged in!

---

## 🧪 Testing & Verification

### Quick Test Script

```bash
# Check if services are running
docker compose ps

# Check if register page loads
curl -I http://localhost:3001/auth/register

# Check OAuth status
./setup-oauth.sh
# Choose option 3 (View current configuration)
```

---

### Manual Testing

1. **Open register page:**
   ```bash
   open http://localhost:3001/auth/register
   ```

2. **Verify buttons are visible:**
   - ✅ Google button should be visible
   - ✅ Instagram button should be visible
   - ✅ Email/Password form should be visible

3. **Test Google sign-in:**
   - Click "Google" button
   - Should redirect to Google
   - Select account
   - Grant permissions
   - Should redirect back to app
   - Should be logged in

4. **Test Instagram sign-in:**
   - Click "Instagram" button
   - Should redirect to Instagram
   - Log in
   - Grant permissions
   - Should redirect back to app
   - Should be logged in

---

## 📊 Current Status

### Build Status:
🔄 **Building** (started at 4:35 PM)  
⏳ **ETA**: Should be complete by now

### Check Build Status:
```bash
docker compose ps
# web should show "Up" status
```

### If Build Not Complete:
```bash
# Check build logs
docker compose logs web --tail=50

# If needed, rebuild
docker compose build web && docker compose up web -d
```

---

## ✅ Success Checklist

After completing setup:

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] Google OAuth credentials created
- [ ] Credentials added to `.env.local`
- [ ] Application restarted
- [ ] Register page loads (HTTP 200)
- [ ] Google button visible
- [ ] Google sign-in works
- [ ] (Optional) Instagram app created
- [ ] (Optional) Instagram credentials added
- [ ] (Optional) Instagram button visible
- [ ] (Optional) Instagram sign-in works

---

## 🐛 Troubleshooting

### Issue: Buttons not visible after build
```bash
# Check if build completed
docker compose ps

# Check logs for errors
docker compose logs web --tail=50

# Rebuild if needed
docker compose build web && docker compose up web -d
```

### Issue: "redirect_uri_mismatch" error
**Fix**: Check redirect URI is exactly:
```
http://localhost:3001/api/auth/callback/google
```
(No trailing slash, correct port 3001)

### Issue: "Access blocked" error
**Fix**: 
- Add your email to test users in OAuth consent screen
- Make sure app is in "Testing" mode

### Issue: Buttons visible but don't work
**Fix**:
- Verify credentials in `.env.local` are correct
- No extra spaces or quotes
- Restart application: `docker compose restart web`

---

## 📞 Need Help?

### Check Status:
```bash
./setup-oauth.sh
# Choose option 3 or 4
```

### View Guides:
```bash
./setup-oauth.sh
# Choose option 5
```

### Quick Commands:
```bash
# Restart app
docker compose restart web

# View logs
docker compose logs web --follow

# Check services
docker compose ps

# Rebuild
docker compose build web && docker compose up web -d
```

---

## 🎯 Summary

**What's Automated:**
- ✅ Button restoration
- ✅ Component fixes
- ✅ OAuth provider configuration
- ✅ Helper script for credential setup

**What You Must Do:**
- 🔐 Get Google OAuth credentials (10 min)
- 🔐 Get Instagram OAuth credentials (15 min - optional)
- ⚙️ Add credentials to `.env.local`
- 🔄 Restart application

**Total Time:** 10-25 minutes depending on which providers you want

---

**Ready to start? Run the helper script:**
```bash
./setup-oauth.sh
```

Or follow the manual steps above! 🚀
