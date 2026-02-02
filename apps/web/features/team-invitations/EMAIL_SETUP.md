# Team Invitation Email Setup Guide

## 🚨 Current Issue

Team invitation emails are **NOT being sent** because email configuration is missing. The system is using Ethereal (test email service) which only creates preview links but doesn't send real emails.

## ✅ Solution: Configure Email Service

You need to configure **one** of the following email services:

---

## Option 1: SendGrid (Recommended - Easiest)

### Step 1: Get SendGrid API Key
1. Go to https://sendgrid.com
2. Sign up for free account (100 emails/day free)
3. Go to Settings → API Keys
4. Create new API key with "Mail Send" permission
5. Copy the API key

### Step 2: Add to Vercel Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:

```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

3. Redeploy your application

### Step 3: Verify Domain (Optional but Recommended)
1. In SendGrid, go to Settings → Sender Authentication
2. Verify your domain or single sender email
3. This improves email deliverability

---

## Option 2: Gmail SMTP

### Step 1: Enable App Password
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Go to App Passwords
4. Generate password for "Mail"
5. Copy the 16-character password

### Step 2: Add to Vercel Environment Variables
```
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
```

---

## Option 3: Custom SMTP Server

### Add to Vercel Environment Variables
```
EMAIL_SERVER_HOST=smtp.yourprovider.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_SECURE=false
EMAIL_SERVER_USER=your-username
EMAIL_SERVER_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

For port 465 (SSL), set `EMAIL_SERVER_SECURE=true`

---

## 🧪 Testing Email Configuration

### After configuring email:

1. **Redeploy** your Vercel application
2. Go to your event → Team tab
3. Click "Add Event Members"
4. Enter an email address
5. Select a role
6. Click "Send Invites"

### Check logs:
- Open browser console (F12)
- Look for email sending logs
- Should see: `✅ Email sent successfully`

### If using SendGrid:
- Check SendGrid Dashboard → Activity
- You'll see email delivery status

### If using Gmail:
- Check Gmail Sent folder
- Email should appear there

---

## 📧 What the Invitation Email Contains

Recipients will receive an email with:

1. **Event name** they're invited to
2. **Role** they're assigned (Owner, Organizer, Staff, Viewer)
3. **Accept button** - Approves invitation and adds them to team
4. **Reject button** - Declines invitation
5. **Expiry notice** - Link expires in 7 days

### Email Preview:
```
Subject: You're invited to collaborate on an event

Hi [Name],

You have been invited as [ROLE] to collaborate on [Event Name].

[Accept Invitation Button]
[Reject Invitation Button]

This link will expire in 7 days.
```

---

## 🔍 Troubleshooting

### Emails not sending?

**Check 1: Environment Variables**
```bash
# In Vercel Dashboard, verify these are set:
SENDGRID_API_KEY (if using SendGrid)
# OR
EMAIL_SERVER_HOST (if using SMTP)
EMAIL_SERVER_USER
EMAIL_SERVER_PASSWORD
```

**Check 2: Redeploy**
- Environment variable changes require redeployment
- Go to Vercel → Deployments → Redeploy

**Check 3: Check Logs**
```bash
# In Vercel Dashboard → Deployments → [Latest] → Functions
# Look for email sending logs
```

**Check 4: Spam Folder**
- Check recipient's spam/junk folder
- Invitation emails might be filtered

### Members not showing in list?

**Issue**: "No members found" message

**Causes**:
1. No invitations have been sent yet
2. Database table `event_team_invitations` doesn't exist
3. API response format mismatch

**Fix**:
1. Send at least one invitation
2. Check browser console for API errors
3. Check Vercel function logs

---

## 🎯 Quick Start Checklist

- [ ] Choose email service (SendGrid recommended)
- [ ] Get API key or SMTP credentials
- [ ] Add environment variables to Vercel
- [ ] Redeploy application
- [ ] Test by sending invitation to yourself
- [ ] Check email inbox (and spam folder)
- [ ] Click "Accept" link in email
- [ ] Verify member appears in Team tab

---

## 📊 Current System Status

### Email System Priority:
1. **Environment SMTP** (EMAIL_SERVER_HOST) - Highest priority
2. **Database SMTP** (KeyValue table) - Medium priority
3. **SendGrid API** (SENDGRID_API_KEY) - Fallback
4. **Ethereal Test** - Last resort (doesn't send real emails)

### Current Configuration:
❌ No SMTP configured
❌ No SendGrid configured
✅ Using Ethereal (test only - emails NOT sent)

**Action Required**: Configure SendGrid or SMTP to send real emails

---

## 🔗 Helpful Links

- [SendGrid Documentation](https://docs.sendgrid.com/for-developers/sending-email/api-getting-started)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Nodemailer SMTP](https://nodemailer.com/smtp/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 💡 Pro Tips

1. **Use SendGrid for production** - More reliable than Gmail SMTP
2. **Verify your domain** - Improves deliverability
3. **Monitor email activity** - Check SendGrid dashboard regularly
4. **Test with multiple emails** - Ensure all recipients receive emails
5. **Check spam scores** - Use tools like mail-tester.com

---

## 🆘 Need Help?

If emails still not working after configuration:

1. Check Vercel function logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Ensure application was redeployed after adding variables
5. Test with a different email address
6. Check email service status (SendGrid, Gmail, etc.)

---

**Remember**: Without proper email configuration, invitation emails will NOT be sent to real recipients!
