# Email Configuration Fix - Team Invitations Not Sending

## Problem
Team member invitations show "Invited successfully" but emails are not being received because the system is using **Ethereal** (a test email service) instead of a real email provider.

## Solution: Configure Real Email Sending

You have **3 options** to fix this:

### Option 1: SendGrid API (Recommended - Easiest)

1. **Get SendGrid API Key:**
   - Go to https://sendgrid.com
   - Sign up for free account (100 emails/day free)
   - Create an API Key with "Mail Send" permissions

2. **Add to Vercel Environment Variables:**
   ```
   SENDGRID_API_KEY=SG.your_api_key_here
   EMAIL_FROM=noreply@yourdomain.com
   ```

3. **Redeploy** your app

### Option 2: Gmail SMTP (For Testing)

1. **Enable App Password in Gmail:**
   - Go to Google Account Settings
   - Security → 2-Step Verification → App Passwords
   - Generate an app password

2. **Add to Vercel Environment Variables:**
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=your_app_password_here
   EMAIL_FROM=your.email@gmail.com
   ```

3. **Redeploy** your app

### Option 3: Custom SMTP Server

```
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_username
SMTP_PASSWORD=your_password
EMAIL_FROM=noreply@yourdomain.com
```

## How Email Sending Works Currently

The system tries in this order:
1. **Primary:** SMTP (from environment variables or database)
2. **Backup:** SendGrid API (if `SENDGRID_API_KEY` is set)
3. **Fallback:** Ethereal (test only - emails NOT delivered) ⚠️

## Checking Current Configuration

The invite endpoint logs show:
- ✅ Invitation created in database
- ✅ Email function called
- ⚠️ But likely using Ethereal (check server logs for "Ethereal" warnings)

## After Configuration

Once you add the environment variables:

1. **Redeploy** on Vercel
2. **Test** by inviting a team member again
3. **Check** your email inbox (and spam folder)
4. **Server logs** will show:
   ```
   ✅ Email sent successfully (Primary): <message-id>
   ```
   Instead of:
   ```
   ⚠️ WARNING: Using Ethereal test account
   ```

## Quick Test

After configuring, you can test email sending by:
1. Go to `/events/[id]/team`
2. Click "Invite Team Member"
3. Enter an email address
4. Check server logs for success message
5. Check the email inbox

## Environment Variables Priority

The system checks in this order:
1. `EMAIL_SERVER_HOST` or `SMTP_HOST`
2. `EMAIL_SERVER_USER` or `SMTP_USER`
3. `EMAIL_SERVER_PASSWORD` or `SMTP_PASSWORD`
4. Database SMTP config (if configured in admin panel)
5. Ethereal fallback (test only)

## Recommended: SendGrid

**Why SendGrid?**
- ✅ Free tier (100 emails/day)
- ✅ Easy setup (just API key)
- ✅ Reliable delivery
- ✅ No SMTP configuration needed
- ✅ Automatic fallback in the code

**Steps:**
1. Sign up at https://sendgrid.com
2. Verify your sender email
3. Create API key
4. Add to Vercel: `SENDGRID_API_KEY=SG.xxx`
5. Redeploy

That's it! Emails will start working immediately.
