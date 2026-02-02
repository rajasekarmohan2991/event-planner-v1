# 📱 SMS & WhatsApp Troubleshooting Guide

## Current Status

You mentioned that **SMS and WhatsApp are not working** even though the environment setup is done.

## 🔍 Diagnostic Steps

### Step 1: Verify Environment Variables

Check that these are set in your `.env` file or Vercel environment variables:

```bash
# Twilio Configuration (Required for both SMS and WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_SMS_FROM=+1234567890
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # Optional, defaults to sandbox

# Optional: Force specific SMS provider
SMS_PROVIDER=twilio  # Options: twilio, textbelt, smsmode

# Optional: Default country code for phone numbers
DEFAULT_SMS_COUNTRY_CODE=+91  # For India
```

### Step 2: Test Configuration API

**Check if environment variables are loaded**:

```bash
curl https://aypheneventplanner.vercel.app/api/test/email-sms
```

**Expected Response**:
```json
{
  "email": { ... },
  "sms": {
    "twilio": {
      "configured": true,  // ← Should be true
      "accountSid": "✓ Set",
      "from": "+1234567890"
    }
  }
}
```

### Step 3: Test SMS Sending

**Send a test SMS**:

```bash
curl -X POST https://aypheneventplanner.vercel.app/api/test/email-sms \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "sms",
    "to": "+919876543210",
    "message": "Test SMS from Event Planner"
  }'
```

**Expected Response** (Success):
```json
{
  "success": true,
  "message": "SMS sent successfully!",
  "details": {
    "messageId": "SMxxxxxxxxxx"
  }
}
```

**Expected Response** (Failure):
```json
{
  "success": false,
  "message": "SMS sending failed",
  "details": {
    "error": "Error message here"
  }
}
```

## 🐛 Common Issues & Solutions

### Issue 1: "TWILIO_SMS_FROM not configured"

**Cause**: Environment variable not set or not loaded

**Solution**:
1. Check `.env` file has `TWILIO_SMS_FROM=+1234567890`
2. In Vercel: Go to Project Settings → Environment Variables
3. Add `TWILIO_SMS_FROM` with your Twilio phone number
4. Redeploy the application

### Issue 2: "Twilio trial restriction" or "free SMS are disabled"

**Cause**: Twilio trial account can only send to verified numbers

**Solution**:
1. **Option A**: Verify recipient phone numbers in Twilio Console
   - Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified
   - Add the phone number you want to test with
   
2. **Option B**: Upgrade Twilio account (add credit)
   - Go to https://console.twilio.com/us1/billing
   - Add at least $20 credit
   - Trial restrictions will be removed

3. **Option C**: Use TextBelt fallback (automatic)
   - The code automatically falls back to TextBelt if Twilio trial fails
   - TextBelt is very limited (1 SMS per day per number on free tier)

### Issue 3: WhatsApp not working

**Cause**: WhatsApp requires sandbox setup or approved template

**Solution**:

**For Testing (Sandbox)**:
1. Go to https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Follow the "Join Sandbox" instructions
3. Send "join [your-sandbox-code]" to the Twilio WhatsApp number
4. Use sandbox number in `TWILIO_WHATSAPP_FROM`

**For Production**:
1. Request WhatsApp Business API access from Twilio
2. Get your number approved
3. Create and approve message templates
4. Update `TWILIO_WHATSAPP_FROM` with your approved number

### Issue 4: "Invalid phone number format"

**Cause**: Phone number not in E.164 format

**Solution**:
- Use E.164 format: `+[country code][number]`
- Examples:
  - India: `+919876543210`
  - US: `+12025551234`
  - UK: `+447911123456`

### Issue 5: Environment variables not loading in Vercel

**Cause**: Variables not set or deployment needed

**Solution**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required variables
3. Select environments: Production, Preview, Development
4. Click "Save"
5. **Redeploy** the application (important!)

## 🧪 Testing Checklist

Use this checklist to diagnose the issue:

- [ ] **Step 1**: Check environment variables are set
  ```bash
  curl https://aypheneventplanner.vercel.app/api/test/email-sms
  ```

- [ ] **Step 2**: Verify Twilio credentials in console
  - Login to https://console.twilio.com
  - Check Account SID and Auth Token match your `.env`

- [ ] **Step 3**: Verify phone number in Twilio
  - Go to Phone Numbers → Manage → Active numbers
  - Confirm the number matches `TWILIO_SMS_FROM`

- [ ] **Step 4**: Test SMS to verified number
  ```bash
  curl -X POST https://aypheneventplanner.vercel.app/api/test/email-sms \\
    -H "Content-Type: application/json" \\
    -d '{"type":"sms","to":"+919876543210","message":"Test"}'
  ```

- [ ] **Step 5**: Check Vercel deployment logs
  - Go to Vercel Dashboard → Deployments → Latest
  - Click "View Function Logs"
  - Look for Twilio-related errors

- [ ] **Step 6**: Check Twilio logs
  - Go to https://console.twilio.com/us1/monitor/logs/sms
  - Look for failed messages
  - Check error codes

## 📊 Error Code Reference

### Twilio Error Codes:

| Code | Meaning | Solution |
|------|---------|----------|
| 21211 | Invalid 'To' number | Use E.164 format (+country code + number) |
| 21408 | Permission denied | Number not verified (trial account) |
| 21606 | From number not owned | Wrong `TWILIO_SMS_FROM` |
| 21610 | Message blocked | Recipient opted out or blocked |
| 30003 | Unreachable destination | Invalid phone number |
| 30006 | Landline or unreachable | Can't send SMS to landline |

## 🔧 Quick Fix Script

Create a test file to verify everything:

```typescript
// test-sms.ts
import { sendSMS, sendWhatsApp } from '@/lib/messaging'

async function test() {
  console.log('Testing SMS...')
  const smsResult = await sendSMS('+919876543210', 'Test SMS')
  console.log('SMS Result:', smsResult)
  
  console.log('Testing WhatsApp...')
  const waResult = await sendWhatsApp('+919876543210', 'Test WhatsApp')
  console.log('WhatsApp Result:', waResult)
}

test()
```

## 🚀 Next Steps

1. **Run the diagnostic API**:
   ```
   GET /api/test/email-sms
   ```

2. **Check the response** and verify all values show "✓ Set"

3. **If not configured**:
   - Add environment variables in Vercel
   - Redeploy

4. **If configured but not working**:
   - Check Twilio console for errors
   - Verify phone numbers
   - Check trial account restrictions

5. **Send me the error details**:
   - Response from `/api/test/email-sms`
   - Error message from test SMS
   - Twilio console error logs

## 📞 Support

If you're still having issues, provide:
1. Response from `GET /api/test/email-sms`
2. Error message when sending test SMS
3. Screenshot of Twilio console (hide sensitive data)
4. Vercel deployment logs

---

**Most Common Fix**: 
- Twilio trial account → Verify recipient phone number in Twilio Console
- OR add $20 credit to remove trial restrictions
