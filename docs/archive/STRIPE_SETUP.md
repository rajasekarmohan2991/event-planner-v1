# Stripe Payment Integration - Quick Setup

## ✅ Current Status
- Stripe SDK installed (v14.25.0)
- API endpoint exists: `/api/payments/stripe/route.ts`
- Webhook handler exists: `/api/payments/stripe/webhook/route.ts`
- Payment form exists: `StripePaymentForm.tsx`

## 🔧 Setup Steps

### 1. Get Real Stripe Keys
Current keys are placeholders. Get real keys from: https://dashboard.stripe.com/test/apikeys

```env
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_REAL_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_REAL_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_REAL_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 2. Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

### 3. Usage in Registration
```tsx
import StripePaymentForm from '@/components/payments/StripePaymentForm'

<StripePaymentForm
  amount={ticketPrice / 100}
  currency="inr"
  registrationId={regId}
  eventId={eventId}
  onSuccess={(paymentIntentId) => {
    console.log('Payment success:', paymentIntentId)
    router.push('/payment/success')
  }}
  onError={(error) => {
    console.error('Payment error:', error)
  }}
/>
```

### 4. Test Payment
```bash
# 1. Update .env with real Stripe keys
# 2. Restart web service
docker compose restart web

# 3. Test payment at:
http://localhost:3001/events/[EVENT_ID]/register
```

## 📝 Files Modified
- ✅ `/api/payments/stripe/route.ts` - Added auth & metadata
- ✅ Webhook handler already configured
- ✅ Payment form ready to use

## 🚀 Next Steps
1. Get real Stripe test keys
2. Update .env file
3. Restart services
4. Test with card 4242 4242 4242 4242
