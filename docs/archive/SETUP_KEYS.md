# API Keys Setup Guide

## 🔑 Stripe Setup (Required for Payments)

### Development (Test Mode)
1. Visit: https://dashboard.stripe.com/test/apikeys
2. Copy your keys:
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx...
   STRIPE_SECRET_KEY=sk_test_51xxxxx...
   ```

### Production (Live Mode)
1. Complete Stripe account verification
2. Visit: https://dashboard.stripe.com/apikeys
3. Copy live keys (only after verification)

## 📧 Email Setup (Required for Notifications)

### Option 1: Gmail (Easiest)
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update .env:
   ```env
   EMAIL_SERVER_HOST=smtp.gmail.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=your-email@gmail.com
   EMAIL_SERVER_PASSWORD=your-16-char-app-password
   EMAIL_FROM=Event Planner <your-email@gmail.com>
   ```

### Option 2: SendGrid (Production)
1. Sign up: https://sendgrid.com
2. Create API Key: Settings → API Keys
3. Update .env:
   ```env
   EMAIL_SERVER_HOST=smtp.sendgrid.net
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=apikey
   EMAIL_SERVER_PASSWORD=SG.your-api-key
   EMAIL_FROM=Event Planner <noreply@yourdomain.com>
   ```

## 🚀 After Adding Keys

1. Update your .env file with real keys
2. Restart the application:
   ```bash
   docker compose restart web
   ```
3. Test the functionality in the app

## 💡 Security Tips

- Never commit API keys to version control
- Use test keys for development
- Rotate keys regularly
- Monitor usage in dashboards
- Set up webhooks for payment confirmations

## 📞 Support Links

- Stripe Support: https://support.stripe.com
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- SendGrid Support: https://support.sendgrid.com
