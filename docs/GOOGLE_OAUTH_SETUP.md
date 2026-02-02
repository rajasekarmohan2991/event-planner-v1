# 🔐 Google OAuth Setup Guide

## ❌ Current Issue

**Problem**: Google Sign-In button doesn't work on registration page  
**Cause**: Google OAuth credentials not configured in `.env.local`  
**Solution**: Follow the steps below to set up Google OAuth

---

## ✅ Quick Fix (2 Options)

### Option 1: Disable Google Sign-In (Temporary)
If you don't need Google OAuth right now, you can disable it:

1. **Edit the auth configuration**:
```typescript
// File: apps/web/lib/auth.ts
// Comment out or conditionally include Google provider:

providers: [
  // Only enable Google if credentials are provided
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  ] : []),
  // ... other providers
]
```

2. **Hide the Google button** in RegisterForm:
```typescript
// File: apps/web/components/auth/RegisterForm.tsx
// Wrap Google button in conditional:

{process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true' && (
  <Button
    type="button"
    variant="outline"
    onClick={() => signIn('google', { callbackUrl: '/' })}
  >
    <FcGoogle className="h-4 w-4" />
    <span>Google</span>
  </Button>
)}
```

### Option 2: Set Up Google OAuth (Recommended)
Follow the complete setup guide below.

---

## 📋 Complete Google OAuth Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**:
   ```
   https://console.cloud.google.com/
   ```

2. **Create a new project**:
   - Click "Select a project" → "New Project"
   - Project name: "Event Planner" (or your app name)
   - Click "Create"

3. **Wait for project creation** (takes ~30 seconds)

---

### Step 2: Enable Google+ API

1. **Go to APIs & Services**:
   ```
   https://console.cloud.google.com/apis/library
   ```

2. **Search for "Google+ API"**

3. **Click "Enable"**

---

### Step 3: Configure OAuth Consent Screen

1. **Go to OAuth consent screen**:
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **Select User Type**:
   - Choose "External" (for testing)
   - Click "Create"

3. **Fill in App Information**:
   - App name: `Event Planner`
   - User support email: `your-email@example.com`
   - Developer contact: `your-email@example.com`
   - Click "Save and Continue"

4. **Scopes** (Step 2):
   - Click "Add or Remove Scopes"
   - Select:
     - `userinfo.email`
     - `userinfo.profile`
   - Click "Update"
   - Click "Save and Continue"

5. **Test Users** (Step 3):
   - Add your email address for testing
   - Click "Save and Continue"

6. **Summary** (Step 4):
   - Review and click "Back to Dashboard"

---

### Step 4: Create OAuth Credentials

1. **Go to Credentials**:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Create Credentials**:
   - Click "Create Credentials" → "OAuth client ID"

3. **Configure OAuth Client**:
   - Application type: `Web application`
   - Name: `Event Planner Web`

4. **Add Authorized JavaScript origins**:
   ```
   http://localhost:3001
   http://localhost:3000
   ```

5. **Add Authorized redirect URIs**:
   ```
   http://localhost:3001/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```

6. **Click "Create"**

7. **Copy Credentials**:
   - You'll see a popup with:
     - Client ID: `1234567890-abcdefghijklmnop.apps.googleusercontent.com`
     - Client Secret: `GOCSPX-abcdefghijklmnopqrstuvwx`
   - **Keep this window open** or download the JSON

---

### Step 5: Update Environment Variables

1. **Open `.env.local`**:
   ```bash
   cd /Users/rajasekar/Event\ Planner\ V1/apps/web
   nano .env.local
   ```

2. **Update Google OAuth credentials**:
   ```env
   # Replace with your actual credentials
   GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnop.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwx
   ```

3. **Save the file** (Ctrl+O, Enter, Ctrl+X)

---

### Step 6: Restart the Application

```bash
# Restart Docker containers
docker compose restart web

# Or rebuild if needed
docker compose up web -d
```

---

### Step 7: Test Google Sign-In

1. **Open the register page**:
   ```
   http://localhost:3001/auth/register
   ```

2. **Click "Google" button**

3. **You should see**:
   - Google OAuth consent screen
   - List of permissions
   - Your test email account

4. **Grant permissions**

5. **You should be**:
   - Redirected back to your app
   - Automatically logged in
   - Redirected to dashboard

---

## 🐛 Troubleshooting

### Issue: "Error 400: redirect_uri_mismatch"
**Solution**: 
- Check that redirect URI in Google Console matches exactly:
  ```
  http://localhost:3001/api/auth/callback/google
  ```
- No trailing slash
- Correct port number

### Issue: "Access blocked: This app's request is invalid"
**Solution**:
- Make sure OAuth consent screen is configured
- Add your email to test users
- Enable Google+ API

### Issue: "Error: Configuration error"
**Solution**:
- Check `.env.local` has correct credentials
- No extra spaces or quotes
- Restart the application after changes

### Issue: Button doesn't do anything
**Solution**:
- Check browser console for errors
- Verify NEXTAUTH_URL is set correctly
- Make sure NextAuth API route exists at `/api/auth/[...nextauth]/route.ts`

---

## 📝 Production Setup

For production deployment, you'll need to:

1. **Update OAuth consent screen**:
   - Change from "Testing" to "In Production"
   - Submit for verification (if needed)

2. **Update redirect URIs**:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

3. **Update environment variables**:
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   GOOGLE_CLIENT_ID=your-production-client-id
   GOOGLE_CLIENT_SECRET=your-production-client-secret
   ```

4. **Add production domain** to authorized origins:
   ```
   https://yourdomain.com
   ```

---

## 🔒 Security Best Practices

1. **Never commit credentials** to Git:
   - `.env.local` is in `.gitignore`
   - Use environment variables in production

2. **Use different credentials** for dev/prod:
   - Create separate OAuth clients
   - Easier to manage and revoke

3. **Restrict redirect URIs**:
   - Only add URIs you control
   - Remove test URIs in production

4. **Enable 2FA** on Google account:
   - Protects your OAuth credentials

5. **Rotate secrets** periodically:
   - Generate new client secret
   - Update in all environments

---

## 📚 Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

---

## ✅ Quick Checklist

Before testing Google Sign-In:

- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] Test users added
- [ ] OAuth credentials created
- [ ] Client ID copied to `.env.local`
- [ ] Client Secret copied to `.env.local`
- [ ] Redirect URIs configured correctly
- [ ] Application restarted
- [ ] Browser cache cleared (if needed)

---

## 🎯 Current Status

**Google OAuth**: ❌ **NOT CONFIGURED**

**To enable Google Sign-In**:
1. Follow steps above to get credentials
2. Update `.env.local` with real credentials
3. Restart application
4. Test on register page

**Alternative**: Use email/password registration (already working)

---

**Last Updated**: October 21, 2025  
**Status**: Waiting for Google OAuth credentials
