# 📧 EMAIL CONFIGURATION GUIDE

## Current Status
- ✅ Email system functional
- ⚠️ Using Ethereal (test mode)
- ❌ No production SMTP configured

---

## 🚀 PRODUCTION EMAIL SETUP

### **Option 1: SendGrid** (Recommended - Easiest)

#### **Why SendGrid?**
- ✅ Free tier: 100 emails/day
- ✅ Easy setup (5 minutes)
- ✅ Reliable delivery
- ✅ Built-in analytics
- ✅ No server configuration needed

#### **Setup Steps:**

**1. Create SendGrid Account**
```
1. Go to: https://sendgrid.com/free
2. Sign up with your email
3. Verify your email address
4. Complete account setup
```

**2. Verify Sender Email**
```
1. Dashboard → Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Enter your email (e.g., noreply@yourdomain.com)
4. Check email and click verification link
```

**3. Create API Key**
```
1. Dashboard → Settings → API Keys
2. Click "Create API Key"
3. Name: "Event Planner Production"
4. Permissions: "Full Access" or "Mail Send"
5. Click "Create & View"
6. **COPY THE KEY** (you won't see it again!)
```

**4. Configure Application**

Add to `.env` file:
```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_actual_api_key_here
EMAIL_FROM=noreply@yourdomain.com

# Optional: Override default from address
SMTP_FROM=noreply@yourdomain.com
```

**5. Test Email Sending**
```bash
# Restart application
npm run dev

# Test by:
# 1. Register for an event
# 2. Complete payment
# 3. Check your email inbox
```

---

### **Option 2: Gmail SMTP** (For Small Scale)

#### **Why Gmail?**
- ✅ Free
- ✅ Reliable
- ⚠️ Limit: 500 emails/day
- ⚠️ Requires App Password setup

#### **Setup Steps:**

**1. Enable 2-Factor Authentication**
```
1. Go to: https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow setup wizard
4. Enable 2FA
```

**2. Generate App Password**
```
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other (Custom name)"
4. Enter: "Event Planner"
5. Click "Generate"
6. **COPY THE 16-CHARACTER PASSWORD**
```

**3. Configure Application**

Add to `.env` file:
```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
SMTP_SECURE=false
```

**4. Test Email Sending**
```bash
# Restart application
npm run dev

# Test by registering for an event
```

---

### **Option 3: Custom SMTP Server**

#### **For Your Own Email Server**

Add to `.env` file:
```env
# Custom SMTP Configuration
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
SMTP_SECURE=false  # true for port 465
```

**Common SMTP Providers:**

**Outlook/Office 365:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

---

## 🧪 TESTING EMAIL CONFIGURATION

### **Quick Test Script**

Create `test-email.js`:
```javascript
import { sendEmail } from './lib/email.js'

async function testEmail() {
  try {
    await sendEmail({
      to: 'your-test-email@example.com',
      subject: 'Test Email from Event Planner',
      html: '<h1>Success!</h1><p>Email configuration is working.</p>',
      text: 'Success! Email configuration is working.'
    })
    console.log('✅ Email sent successfully!')
  } catch (error) {
    console.error('❌ Email failed:', error)
  }
}

testEmail()
```

Run test:
```bash
node test-email.js
```

---

## 📊 EMAIL MONITORING

### **SendGrid Dashboard**
- View sent emails
- Track delivery rates
- Monitor bounces
- Check spam reports

### **Application Logs**
Check console for:
```
📧 Attempting to send email to: user@example.com
✅ Email sent successfully
```

Or errors:
```
❌ Email send error: [error details]
```

---

## 🔒 SECURITY BEST PRACTICES

### **1. Environment Variables**
```bash
# NEVER commit .env file to git
# Add to .gitignore:
.env
.env.local
.env.production
```

### **2. API Key Security**
- ✅ Use environment variables
- ✅ Rotate keys regularly
- ✅ Use minimum required permissions
- ❌ Never hardcode in source code
- ❌ Never share in public repos

### **3. Email Validation**
- ✅ Validate email addresses
- ✅ Implement rate limiting
- ✅ Monitor for abuse
- ✅ Handle bounces properly

---

## 🚨 TROUBLESHOOTING

### **Email Not Sending**

**1. Check Configuration**
```bash
# Verify environment variables are set
echo $SENDGRID_API_KEY
echo $SMTP_HOST
```

**2. Check Logs**
```bash
# Look for email errors in console
npm run dev
# Try sending an email
```

**3. Test Connection**
```javascript
// Test SMTP connection
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ SMTP Error:', error)
  } else {
    console.log('✅ SMTP Ready')
  }
})
```

### **Common Issues**

**Issue**: "Invalid API Key"
**Solution**: Regenerate SendGrid API key and update .env

**Issue**: "Authentication failed"
**Solution**: Check SMTP username/password, regenerate app password

**Issue**: "Connection timeout"
**Solution**: Check firewall, verify SMTP port (587 or 465)

**Issue**: "Emails go to spam"
**Solution**: 
- Verify sender domain
- Set up SPF/DKIM records
- Use professional email content

---

## 📈 SCALING CONSIDERATIONS

### **Email Volume Limits**

| Provider | Free Tier | Paid Plans |
|----------|-----------|------------|
| SendGrid | 100/day | From $19.95/mo (50k/mo) |
| Gmail | 500/day | N/A (use G Suite) |
| AWS SES | 62k/mo | $0.10 per 1k emails |
| Mailgun | 5k/mo | From $35/mo (50k/mo) |

### **When to Upgrade**

- ✅ Sending > 100 emails/day → Upgrade SendGrid
- ✅ Need dedicated IP → AWS SES or Mailgun
- ✅ Advanced analytics → SendGrid Pro
- ✅ Transactional + Marketing → Mailgun or SendGrid

---

## ✅ PRODUCTION CHECKLIST

Before going live:

- [ ] Email service configured (SendGrid or SMTP)
- [ ] Environment variables set
- [ ] Test email sent successfully
- [ ] Sender email verified
- [ ] Email templates tested
- [ ] Bounce handling configured
- [ ] Rate limiting implemented
- [ ] Monitoring set up
- [ ] Backup email service configured (optional)

---

## 📞 NEXT STEPS

1. **Choose email provider** (SendGrid recommended)
2. **Follow setup steps** above
3. **Configure .env file**
4. **Test email sending**
5. **Monitor delivery rates**
6. **Deploy to production**

---

**Estimated Setup Time**: 10-15 minutes  
**Difficulty**: Easy  
**Recommended**: SendGrid (fastest setup)
