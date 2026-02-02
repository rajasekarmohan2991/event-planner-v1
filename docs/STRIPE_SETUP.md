# Stripe Integration Setup Guide

This guide will help you set up Stripe for your Event Planner application.

## 1. Install Stripe CLI

### macOS (using Homebrew)
```bash
brew install stripe/stripe-cli/stripe
```

### Linux (using Homebrew)
```bash
brew install stripe-cli
```

### Alternative Installation Methods
- **Docker**: `docker run --rm -it stripe/stripe-cli:latest`
- **Direct Download**: Download from [Stripe CLI releases](https://github.com/stripe/stripe-cli/releases)

## 2. Authenticate with Stripe

```bash
stripe login
```

This will:
1. Open your browser to authenticate
2. Generate restricted API keys
3. Create a pairing code for verification

**Example Output:**
```
Your pairing code is: enjoy-enough-outwit-win
Press Enter to open the browser or visit https://dashboard.stripe.com/stripecli/confirm_auth?t=...
```

## 3. Test Stripe CLI Setup

Create a test product:
```bash
stripe products create \
  --name="Event Planner Test Product" \
  --description="Test product for Event Planner integration"
```

Create a test price:
```bash
stripe prices create \
  --unit-amount=5000 \
  --currency=inr \
  --product="{{PRODUCT_ID_FROM_ABOVE}}"
```

## 4. Get Your API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable Key** and **Secret Key**
3. Update your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

## 5. Set Up Webhooks

### Create Webhook Endpoint
```bash
stripe listen --forward-to localhost:3001/api/payments/stripe/webhook
```

This will:
1. Create a webhook endpoint in your Stripe dashboard
2. Forward events to your local development server
3. Provide a webhook signing secret

### Important Webhook Events
Your Event Planner listens for these events:
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `charge.dispute.created` - Chargeback/dispute created
- `invoice.payment_succeeded` - Subscription payment succeeded
- `customer.created` - New customer created

## 6. Test Payment Integration

### Test Cards for India (INR)
```
# Successful payments
4000003560000008 - Visa (India)
4000003560000016 - Visa Debit (India)

# Declined payments
4000000000000002 - Generic decline
4000000000000069 - Expired card
4000000000000127 - Incorrect CVC

# 3D Secure authentication required
4000002760003184 - Visa (India) - requires authentication
```

### Test Payment Flow
1. Register for an event in your application
2. Choose Stripe as payment provider
3. Use test card numbers above
4. Verify payment completion and email notification

## 7. Production Setup

### When ready for production:

1. **Switch to Live Mode**:
   - Get live API keys from Stripe Dashboard
   - Update environment variables with live keys
   - Set `NODE_ENV=production`

2. **Webhook Configuration**:
   - Create production webhook endpoint
   - Point to your production domain
   - Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

3. **Security Checklist**:
   - ✅ API keys stored securely (environment variables)
   - ✅ Webhook signatures verified
   - ✅ HTTPS enabled in production
   - ✅ Error handling implemented
   - ✅ Logging configured for monitoring

## 8. Event Planner Integration Features

### Implemented Stripe Features:
- ✅ **Payment Intents** - Secure payment processing
- ✅ **Customer Management** - Automatic customer creation
- ✅ **Webhook Handling** - Real-time payment updates
- ✅ **Refund Processing** - Admin-initiated refunds
- ✅ **Email Notifications** - Payment confirmations with QR codes
- ✅ **Multi-currency Support** - INR, USD, EUR, etc.

### Payment Flow:
1. **User Registration** → Creates registration record
2. **Payment Page** → User selects Stripe as provider
3. **Payment Intent** → Creates secure payment session
4. **Payment Processing** → Handles card details securely
5. **Webhook Confirmation** → Updates registration status
6. **Email & QR Code** → Sends confirmation with check-in QR code

## 9. Monitoring & Analytics

### Stripe Dashboard
- View all transactions
- Monitor payment success rates
- Handle disputes and chargebacks
- Generate financial reports

### Event Planner Analytics
- Payment provider breakdown (Stripe vs Razorpay)
- Revenue tracking by event
- Refund analytics
- Registration conversion rates

## 10. Troubleshooting

### Common Issues:

**Webhook not receiving events:**
```bash
# Check webhook status
stripe listen --print-secret

# Test webhook manually
stripe trigger payment_intent.succeeded
```

**API key issues:**
```bash
# Verify API key
stripe balance retrieve
```

**Payment failures:**
- Check Stripe Dashboard logs
- Verify webhook endpoint is accessible
- Ensure proper error handling in application

### Support Resources:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe CLI Reference](https://stripe.com/docs/cli)
- [Event Planner Support](mailto:support@eventplanner.com)

---

## Quick Start Commands

```bash
# 1. Install Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Login to Stripe
stripe login

# 3. Test API connection
stripe balance retrieve

# 4. Start webhook forwarding (development)
stripe listen --forward-to localhost:3001/api/payments/stripe/webhook

# 5. Test payment
stripe payment_intents create --amount=5000 --currency=inr
```

Your Event Planner is now ready to accept payments through Stripe! 🎉
