# Environment Variables for Vercel Deployment

## Required for NextAuth to work properly

### CRITICAL - Must be set in Vercel:
NEXTAUTH_URL=https://aypheneventplanner.vercel.app
NEXTAUTH_SECRET=your-secret-key-here

### IMPORTANT: NEXTAUTH_URL Configuration
- Set NEXTAUTH_URL to your PRODUCTION domain only
- Do NOT include preview URLs (web-xxxxx.vercel.app)
- The app will automatically work with preview URLs via trustHost
- Example: https://aypheneventplanner.vercel.app (your main domain)

### How to set in Vercel:
1. Go to your Vercel project dashboard
2. Click on "Settings"
3. Click on "Environment Variables"
4. Add these variables:
   - NEXTAUTH_URL = https://aypheneventplanner.vercel.app (PRODUCTION ONLY)
   - NEXTAUTH_SECRET = (use the same value from your .env file)
   - Select "Production" environment ONLY for NEXTAUTH_URL
   - Select all environments for NEXTAUTH_SECRET

### After adding:
1. Click "Save"
2. Redeploy your application

## Why this is needed:
NextAuth requires NEXTAUTH_URL to be explicitly set in production to:
- Handle OAuth callbacks correctly
- Set cookies with the correct domain
- Prevent CORS issues
- Enable proper session management

## Current Issue:
The CORS error you're seeing is because NEXTAUTH_URL is not set,
causing NextAuth to not recognize the request origin properly.

## Preview URLs:
- Preview URLs (web-xxxxx.vercel.app) will work automatically
- No need to set NEXTAUTH_URL for each preview
- The trustHost option handles this
