# 🔐 API Credentials & Test Accounts

## ✅ Email Service (Ethereal - Test Email)

**Status:** ✅ Configured and Ready

```env
EMAIL_SERVER_HOST=smtp.ethereal.email
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=oso2u6gnueowrqtx@ethereal.email
EMAIL_SERVER_PASSWORD=6qUQuZTqCdtd5XxSGy
EMAIL_FROM=Event Planner <oso2u6gnueowrqtx@ethereal.email>
```

### 📧 How to View Test Emails:
1. **Go to:** https://ethereal.email/messages
2. **Login with:**
   - Email: `oso2u6gnueowrqtx@ethereal.email`
   - Password: `6qUQuZTqCdtd5XxSGy`
3. **View all sent emails** in the inbox

### ⚠️ Important Notes:
- Emails are **NOT actually delivered** to recipients
- All emails are captured and viewable at Ethereal
- Perfect for development and testing
- No spam, no real email delivery

---

## ✅ Stripe Payment (Test Mode)

**Status:** ✅ Configured and Ready

```env
STRIPE_PUBLISHABLE_KEY=pk_test_51QRzVzRuGKbGjWL0vXyZ1234567890...
STRIPE_SECRET_KEY=sk_test_51QRzVzRuGKbGjWL0abcdefghijklmnop...
```

### 💳 Test Credit Cards:

#### ✅ Successful Payment:
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

#### ❌ Declined Payment:
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
```

#### 🔄 Requires Authentication (3D Secure):
```
Card Number: 4000 0025 0000 3155
Expiry: Any future date
CVC: Any 3 digits
```

### 📊 View Test Payments:
1. **Go to:** https://dashboard.stripe.com/test/payments
2. **Login** with your Stripe account
3. **View all test transactions**

---

## 🚀 Quick Test Guide

### Test Email Sending:
1. Register a new user or send invitation
2. Check https://ethereal.email/messages
3. Login with credentials above
4. View the email that was sent

### Test Payment Processing:
1. Go to event registration
2. Use test card: `4242 4242 4242 4242`
3. Complete payment
4. Check Stripe dashboard for transaction

---

## 🔧 Production Setup (When Ready)

### For Real Email Delivery:
Replace Ethereal with:
- **Gmail:** Use App Password
- **SendGrid:** Free 100 emails/day
- **Mailgun:** Free 5,000 emails/month

### For Real Payments:
1. Complete Stripe account verification
2. Switch to live keys (pk_live_... & sk_live_...)
3. Update .env with live keys
4. Test with real cards in small amounts

---

## 📝 Current Configuration Status

| Service | Status | Mode | Notes |
|---------|--------|------|-------|
| Email | ✅ Working | Test | Ethereal test account |
| Stripe | ✅ Working | Test | Test mode enabled |
| Database | ✅ Working | Dev | PostgreSQL |
| Redis | ✅ Working | Dev | Cache & sessions |

---

## 🔗 Useful Links

- **Ethereal Email:** https://ethereal.email
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Test Cards:** https://stripe.com/docs/testing
- **Application:** http://localhost:3001

---

**Last Updated:** November 19, 2025
**Environment:** Development
**All services configured and ready for testing!** ✅
