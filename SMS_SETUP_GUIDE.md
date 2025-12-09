# SMS Setup Guide - Fix "Free SMS Disabled" Error

## 🚨 Problem

You're seeing this error:
```
"Sorry, free SMS are disabled for this country due to abuse."
```

This happens because **Twilio trial accounts** have restrictions to prevent spam/abuse.

---

## ✅ **Solution 1: Verify Phone Numbers (FREE - Immediate)**

### Steps:
1. **Go to Twilio Console:** https://console.twilio.com/
2. **Click:** Phone Numbers → Verified Caller IDs
3. **Click:** "Add a new Caller ID" (red button)
4. **Enter:** +919876543210 (the number you want to send SMS to)
5. **Verify:** Twilio will call/SMS that number with a code
6. **Enter code:** Complete verification
7. **Done!** You can now send SMS to that number

### Pros:
- ✅ Completely FREE
- ✅ Works immediately
- ✅ No credit card needed

### Cons:
- ❌ Only works for verified numbers
- ❌ Not scalable (must verify each number)
- ❌ Not suitable for production

### When to Use:
- Testing with your own phone
- Demo to specific people
- Development environment

---

## ✅ **Solution 2: Upgrade Twilio Account (PAID - Recommended)**

### Steps:
1. **Go to:** https://console.twilio.com/billing
2. **Click:** "Upgrade your account"
3. **Add payment method:** Credit/debit card
4. **Add funds:** $20-50 recommended
5. **Done!** All restrictions removed

### Pricing:
- **India:** ₹0.50-1.00 per SMS (~$0.006-0.012)
- **US:** $0.0075 per SMS
- **UK:** $0.04 per SMS
- **Other countries:** See https://www.twilio.com/sms/pricing

### Example Costs:
- 100 SMS in India: ~₹50-100 (~$0.60-1.20)
- 1000 SMS in India: ~₹500-1000 (~$6-12)

### Pros:
- ✅ Send to ANY number worldwide
- ✅ No restrictions
- ✅ Production-ready
- ✅ Reliable delivery
- ✅ Delivery reports

### Cons:
- ❌ Costs money (but very cheap)
- ❌ Requires credit card

### When to Use:
- Production environment
- Sending to many users
- Real event with attendees

---

## ✅ **Solution 3: Use TextBelt (FREE - Automatic Fallback)**

### What I Did:
I've configured the system to **automatically fallback to TextBelt** when Twilio fails.

### How It Works:
1. System tries Twilio first
2. If Twilio fails with "free SMS disabled" error
3. System automatically tries TextBelt
4. TextBelt sends the SMS (free, but limited)

### TextBelt Limitations:
- ✅ FREE (no signup needed)
- ✅ Works in many countries
- ❌ Limited to **1 SMS per day per phone number**
- ❌ Not reliable for production
- ❌ May not work in all countries

### To Force TextBelt:
Edit `/apps/web/.env.local`:
```env
# Uncomment this line to force TextBelt
SMS_PROVIDER=textbelt
```

Then restart:
```bash
docker compose restart web
```

---

## 🔧 **Quick Fix for Testing (RIGHT NOW)**

### Option A: Force TextBelt (1 minute)
1. Edit `.env.local`:
   ```env
   SMS_PROVIDER=textbelt
   ```

2. Restart:
   ```bash
   docker compose restart web
   ```

3. Try sending SMS again
   - Will work for 1 SMS per day per number
   - Good for immediate testing

### Option B: Verify Your Number (5 minutes)
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click "Add a new Caller ID"
3. Enter: +919876543210
4. Verify with code
5. Try sending SMS again
   - Will work for verified numbers only
   - Good for testing with your phone

### Option C: Upgrade Twilio (10 minutes)
1. Go to: https://console.twilio.com/billing
2. Add $20 to account
3. Upgrade to paid
4. Try sending SMS again
   - Will work for ALL numbers
   - Best for production

---

## 📊 **Comparison Table**

| Solution | Cost | Setup Time | Limitations | Best For |
|----------|------|------------|-------------|----------|
| **Verify Numbers** | FREE | 5 min | Only verified numbers | Testing with your phone |
| **Upgrade Twilio** | ~$0.01/SMS | 10 min | None | Production |
| **TextBelt** | FREE | 1 min | 1 SMS/day/number | Quick testing |

---

## 🚀 **Recommended Approach**

### For Development/Testing:
1. **Use TextBelt** for quick tests (already configured)
2. **Verify your phone** for more reliable testing
3. **Upgrade Twilio** when ready for production

### For Production:
1. **Upgrade Twilio account** (required)
2. **Add $50-100** to account
3. **Monitor usage** in Twilio console
4. **Set up alerts** for low balance

---

## 🔍 **How to Check Current SMS Provider**

Check Docker logs:
```bash
docker compose logs web | grep "SMS provider"
```

You'll see:
```
📱 Using forced SMS provider: textbelt
```
or
```
📱 Using SMS provider: twilio
```

---

## 🧪 **Testing SMS After Fix**

### Test via API:
```bash
curl -X POST http://localhost:3001/api/test/email-sms \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sms",
    "to": "+919876543210",
    "message": "Test SMS from Event Planner!"
  }'
```

### Test via UI:
1. Go to: http://localhost:3001/events/14/communicate
2. Click "SMS" tab
3. Click "Load Phone Numbers"
4. Enter message
5. Click "Send to X Recipients"
6. Check logs: `docker compose logs web | grep "📱"`

---

## 📧 **Alternative: Use Email Instead**

If SMS is not critical, you can use email notifications instead:
- ✅ FREE (using Ethereal for testing)
- ✅ No restrictions
- ✅ Already configured
- ✅ More reliable

Email is already working in your system!

---

## 🎯 **My Recommendation**

### For Right Now (Testing):
```bash
# Edit .env.local
SMS_PROVIDER=textbelt

# Restart
docker compose restart web

# Test - will work for 1 SMS per day
```

### For Production (Before Launch):
1. Upgrade Twilio account
2. Add $50 to balance
3. Remove `SMS_PROVIDER=textbelt` from .env.local
4. System will use Twilio automatically

---

## ✅ **What I've Already Done**

1. ✅ Added automatic fallback to TextBelt
2. ✅ Added `SMS_PROVIDER` environment variable
3. ✅ Updated `.env.local` with documentation
4. ✅ Added detailed logging for debugging
5. ✅ System will retry with TextBelt if Twilio fails

**You can now:**
- Force TextBelt by setting `SMS_PROVIDER=textbelt`
- Or verify your phone number in Twilio
- Or upgrade Twilio account

---

## 🆘 **Need Help?**

### Twilio Support:
- Console: https://console.twilio.com/
- Docs: https://www.twilio.com/docs/sms
- Support: https://support.twilio.com/

### TextBelt:
- Website: https://textbelt.com/
- Docs: https://textbelt.com/docs

---

## 📝 **Summary**

**Problem:** Twilio trial account blocks SMS to unverified numbers  
**Quick Fix:** Use TextBelt (set `SMS_PROVIDER=textbelt`)  
**Permanent Fix:** Upgrade Twilio account ($20-50)  
**Alternative:** Verify phone numbers (free but limited)

**Choose based on your needs!** 🚀
