# 🚀 Quick Start: Stripe Integration

Get Stripe running in your Event Planner in 5 minutes!

## Step 1: Install Stripe CLI (2 minutes)

### macOS
```bash
brew install stripe/stripe-cli/stripe
```

### Linux
```bash
brew install stripe-cli
```

### Verify Installation
```bash
stripe --version
```

## Step 2: Get Your API Keys (1 minute)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable Key** and **Secret Key**
3. Update your `.env` file:

```env
# Replace with your actual keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

## Step 3: Authenticate Stripe CLI (1 minute)

```bash
stripe login
```

Follow the browser prompt to authenticate.

## Step 4: Test Integration (1 minute)

```bash
# Install dependencies
npm install

# Run health check
npm run stripe:health

# Run integration test
npm run stripe:test
```

## Step 5: Start Development Server

```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Start webhook forwarding
npm run stripe:listen
```

## 🎉 You're Ready!

Your Event Planner now accepts Stripe payments!

### Test Payment Flow:
1. Go to `http://localhost:3001`
2. Create an event
3. Register for the event
4. Choose **Stripe** as payment provider
5. Use test card: `4000003560000008`

### Test Cards (India):
- **Success**: `4000003560000008`
- **Decline**: `4000000000000002`
- **3D Secure**: `4000002760003184`

### What Happens:
✅ Payment processed securely  
✅ Registration confirmed  
✅ Email sent with QR code  
✅ Webhook updates database  
✅ Admin can process refunds  

## 📊 Monitor Payments

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Event Planner Analytics**: `/admin/payments`
- **Webhook Logs**: Terminal running `stripe:listen`

## 🔧 Troubleshooting

**Webhook not working?**
```bash
# Check if webhook is running
npm run stripe:listen

# Test webhook manually
stripe trigger payment_intent.succeeded
```

**API key issues?**
```bash
# Verify API key
stripe balance retrieve
```

**Need help?**
- Check `STRIPE_SETUP.md` for detailed guide
- Run `npm run stripe:health` for diagnostics
- View Stripe Dashboard logs

---

## Production Deployment

When ready for live payments:

1. **Get Live Keys**: Switch to live mode in Stripe Dashboard
2. **Update Environment**: Replace test keys with live keys
3. **Configure Webhooks**: Point to your production domain
4. **Test Thoroughly**: Use small amounts first

**Live Environment Variables:**
```env
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
NODE_ENV=production
```

🎊 **Congratulations!** Your Event Planner is now processing real payments with Stripe!
