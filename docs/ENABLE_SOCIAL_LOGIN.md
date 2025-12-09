# 🔐 Enable Google & Instagram Login - Quick Guide

## ✅ Good News!

The Google and Instagram buttons are now **restored** and will appear on the register page after the current build completes!

However, they need OAuth credentials to work. Here's how to set them up:

---

## 🚀 Quick Setup (Choose One)

### Option 1: Google Sign-In Only (Recommended - Easiest)
⏱️ **Time**: 10 minutes  
✅ **Most users have Google accounts**  
✅ **Easiest to set up**

### Option 2: Instagram Sign-In Only
⏱️ **Time**: 15 minutes  
⚠️ **Requires Facebook Developer account**  
⚠️ **More complex setup**

### Option 3: Both Google + Instagram
⏱️ **Time**: 20 minutes  
✅ **Best user experience**  
⚠️ **Requires both setups**

---

## 📋 Google OAuth Setup (Recommended)

### Step 1: Create Google Cloud Project (2 min)

1. **Go to Google Cloud Console**:
   ```
   https://console.cloud.google.com/
   ```

2. **Create new project**:
   - Click "Select a project" dropdown
   - Click "NEW PROJECT"
   - Project name: `Event Planner`
   - Click "CREATE"

3. **Wait** for project creation (~30 seconds)

---

### Step 2: Configure OAuth Consent Screen (3 min)

1. **Go to OAuth consent screen**:
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **Select User Type**:
   - Choose "External"
   - Click "CREATE"

3. **Fill App Information**:
   - App name: `Event Planner`
   - User support email: `your-email@gmail.com`
   - Developer contact: `your-email@gmail.com`
   - Click "SAVE AND CONTINUE"

4. **Scopes** (Step 2):
   - Click "ADD OR REMOVE SCOPES"
   - Select:
     - ✅ `.../auth/userinfo.email`
     - ✅ `.../auth/userinfo.profile`
   - Click "UPDATE"
   - Click "SAVE AND CONTINUE"

5. **Test Users** (Step 3):
   - Click "ADD USERS"
   - Add your email: `your-email@gmail.com`
   - Click "ADD"
   - Click "SAVE AND CONTINUE"

6. **Summary** (Step 4):
   - Review and click "BACK TO DASHBOARD"

---

### Step 3: Create OAuth Credentials (3 min)

1. **Go to Credentials**:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Create Credentials**:
   - Click "CREATE CREDENTIALS"
   - Select "OAuth client ID"

3. **Configure**:
   - Application type: `Web application`
   - Name: `Event Planner Web`

4. **Authorized JavaScript origins**:
   ```
   http://localhost:3001
   ```

5. **Authorized redirect URIs**:
   ```
   http://localhost:3001/api/auth/callback/google
   ```

6. **Click "CREATE"**

7. **Copy Credentials**:
   - You'll see a popup with:
     - **Client ID**: `123456789-abc...apps.googleusercontent.com`
     - **Client Secret**: `GOCSPX-abc...xyz`
   - **IMPORTANT**: Keep this window open or click "DOWNLOAD JSON"

---

### Step 4: Update Environment Variables (1 min)

1. **Open `.env.local`**:
   ```bash
   cd "/Users/rajasekar/Event Planner V1/apps/web"
   nano .env.local
   ```

2. **Update these lines**:
   ```env
   # Replace with your actual credentials
   GOOGLE_CLIENT_ID=paste-your-client-id-here
   GOOGLE_CLIENT_SECRET=paste-your-client-secret-here
   ```

3. **Save** (Ctrl+O, Enter, Ctrl+X)

---

### Step 5: Restart Application (1 min)

```bash
cd "/Users/rajasekar/Event Planner V1"
docker compose restart web
```

---

### Step 6: Test Google Sign-In ✅

1. **Open register page**:
   ```
   http://localhost:3001/auth/register
   ```

2. **Click "Google" button**

3. **You should see**:
   - Google OAuth consent screen
   - Your test email
   - Permission requests

4. **Click "Continue"**

5. **Success!** ✅
   - You're redirected back
   - Automatically logged in
   - Redirected to dashboard

---

## 📋 Instagram OAuth Setup (Optional)

### Step 1: Create Facebook App (5 min)

1. **Go to Facebook Developers**:
   ```
   https://developers.facebook.com/apps/
   ```

2. **Create App**:
   - Click "Create App"
   - Choose "Consumer"
   - Click "Next"

3. **App Details**:
   - App name: `Event Planner`
   - Contact email: `your-email@example.com`
   - Click "Create App"

4. **Complete Security Check**

---

### Step 2: Add Instagram Basic Display (3 min)

1. **In App Dashboard**:
   - Scroll to "Add Products"
   - Find "Instagram Basic Display"
   - Click "Set Up"

2. **Create Instagram App**:
   - Click "Create New App"
   - Display Name: `Event Planner`
   - Click "Create App"

---

### Step 3: Configure Instagram App (5 min)

1. **Basic Display Settings**:
   - Valid OAuth Redirect URIs:
     ```
     http://localhost:3001/api/auth/callback/instagram
     ```
   - Deauthorize Callback URL:
     ```
     http://localhost:3001/api/auth/deauthorize
     ```
   - Data Deletion Request URL:
     ```
     http://localhost:3001/api/auth/delete
     ```

2. **Save Changes**

3. **Copy Credentials**:
   - Instagram App ID: `1234567890`
   - Instagram App Secret: `abc...xyz`

---

### Step 4: Add Test Users (2 min)

1. **Scroll to "User Token Generator"**
2. **Click "Add Instagram Testers"**
3. **Add your Instagram username**
4. **Accept invitation** in Instagram app

---

### Step 5: Update Environment Variables (1 min)

```env
# Add to .env.local
INSTAGRAM_CLIENT_ID=your-instagram-app-id
INSTAGRAM_CLIENT_SECRET=your-instagram-app-secret
```

---

### Step 6: Restart & Test

```bash
docker compose restart web
```

Then test Instagram sign-in on register page!

---

## 🎯 What You'll See After Setup

### Before OAuth Setup:
```
Register Page:
- Google button (won't work - needs credentials)
- Instagram button (won't work - needs credentials)
- Email/Password form (✅ works!)
```

### After Google OAuth Setup:
```
Register Page:
- Google button (✅ WORKS!)
- Instagram button (needs credentials)
- Email/Password form (✅ works!)
```

### After Both OAuth Setups:
```
Register Page:
- Google button (✅ WORKS!)
- Instagram button (✅ WORKS!)
- Email/Password form (✅ works!)
```

---

## 🐛 Troubleshooting

### Google: "Error 400: redirect_uri_mismatch"
**Fix**: Check redirect URI is exactly:
```
http://localhost:3001/api/auth/callback/google
```
(No trailing slash, correct port)

### Google: "Access blocked"
**Fix**: 
- Add your email to test users
- Make sure OAuth consent screen is configured

### Instagram: Button doesn't appear
**Fix**:
- Check INSTAGRAM_CLIENT_ID is set in `.env.local`
- Restart application
- Clear browser cache

### Buttons visible but don't work
**Fix**:
- Check credentials are correct (no extra spaces)
- Check redirect URIs match exactly
- Restart application after changes

---

## ✅ Current Status

**Build Status**: 🔄 Rebuilding with social buttons restored  
**ETA**: 5-10 minutes  

**After Build**:
- ✅ Google button will appear
- ✅ Instagram button will appear
- ⚠️ Both need OAuth credentials to work
- ✅ Email/password works without any setup

---

## 💡 Recommendations

### For Quick Testing:
**Use email/password** - Works immediately, no setup needed

### For Production:
**Set up Google OAuth** - Most users have Google accounts, easiest setup

### For Maximum Options:
**Set up both** - Best user experience, more sign-in options

---

## 📝 Summary

1. **Buttons are restored** ✅
2. **Build is running** 🔄
3. **OAuth setup needed** for buttons to work
4. **Email/password works** without any setup
5. **Follow guides above** to enable social login

---

**After the current build completes, you'll see the buttons!** 🎉

**To make them work, follow the OAuth setup steps above.** 🔐
