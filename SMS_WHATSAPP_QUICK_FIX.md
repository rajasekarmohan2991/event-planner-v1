# 🔍 SMS & WhatsApp - Quick Fix Checklist

Since environment is configured, the issue is likely one of these:

## ✅ **Check These in Order**:

### 1. **Phone Numbers Not Loading** (Most Common)

**Issue**: The "Load Phone Numbers" button might not be fetching phone numbers from registrations.

**Check**:
- Click "Load Phone Numbers" button on SMS/WhatsApp tab
- Does it show `(0)` or actual count like `(5)`?

**Fix if 0 phone numbers**:
- Registrations might not have phone numbers
- Check if registration form collects phone numbers
- Verify phone field name in registration data

### 2. **Phone Number Format** (Second Most Common)

**Issue**: Phone numbers not in E.164 format

**Check**: Phone numbers should be like:
- ✅ `+919876543210` (India)
- ✅ `+12025551234` (US)
- ❌ `9876543210` (Missing +91)
- ❌ `+91 98765 43210` (Has spaces)

**Fix**: Update the phone normalization in `/lib/messaging.ts` (already done, but verify)

### 3. **Twilio Trial Restrictions** (Third Most Common)

**Issue**: Twilio trial can only send to verified numbers

**Check**:
- Are you testing with a verified number?
- Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified

**Fix**:
- Add test number to verified list
- OR upgrade Twilio account ($20 minimum)

### 4. **API Response Not Showing Errors**

**Issue**: Error messages might be hidden

**Fix**: Check browser console for errors:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try sending SMS
4. Look for red error messages

## 🧪 **Quick Test**:

### Test 1: Check if phone numbers are loaded
```
1. Go to Events → [Your Event] → Communicate
2. Click SMS tab
3. Click "Load Phone Numbers"
4. Does it show a number > 0?
```

### Test 2: Check API directly
```bash
# Check configuration
curl https://aypheneventplanner.vercel.app/api/test/email-sms

# Should show:
# "twilio": { "configured": true, "accountSid": "✓ Set", ... }
```

### Test 3: Send test SMS via API
```bash
curl -X POST https://aypheneventplanner.vercel.app/api/test/email-sms \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sms",
    "to": "+919876543210",
    "message": "Test from Event Planner"
  }'
```

## 🔧 **Immediate Fixes**:

### Fix 1: Update Error Message (Minor UX fix)

The error message says "Check SMSMode" but should say "Check Twilio". I'll fix this.

### Fix 2: Add Better Error Logging

Add console logging to see exact error from Twilio.

### Fix 3: Add Phone Number Validation

Validate phone numbers before sending.

## 📊 **What to Send Me**:

To help you fix this quickly, please provide:

1. **Number of phone numbers loaded**:
   - Go to SMS tab
   - Click "Load Phone Numbers"
   - What number does it show? `(0)` or `(5)` etc.?

2. **Browser console errors**:
   - Open DevTools (F12)
   - Go to Console tab
   - Try sending SMS
   - Copy any red error messages

3. **Test API response**:
   ```bash
   curl https://aypheneventplanner.vercel.app/api/test/email-sms
   ```
   - Copy the response

4. **Actual error message shown**:
   - What does the red error box say after clicking "Send"?

## 🚀 **Most Likely Solution**:

Based on "env is properly configured", the issue is probably:

**90% chance**: No phone numbers in registrations
- **Fix**: Ensure registration form has phone field
- **Or**: Manually add phone numbers for testing

**8% chance**: Phone format issue
- **Fix**: Use E.164 format (+country code)

**2% chance**: Twilio trial restriction
- **Fix**: Verify recipient number in Twilio console

---

**Next Step**: Please run the tests above and send me the results. I'll then provide the exact fix.
