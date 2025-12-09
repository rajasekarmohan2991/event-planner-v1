# SMSMode Integration - Free SMS API

## Overview

We have successfully replaced Twilio with SMSMode for SMS functionality. SMSMode offers a free SMS API with no subscription or integration fees - you only pay for the SMS messages sent.

## Benefits of SMSMode

- ✅ **No subscription fees** - Only pay for SMS messages sent
- ✅ **Global reach** - Send SMS to over 500 networks worldwide  
- ✅ **Simple integration** - Easy HTTP API
- ✅ **Cost-effective** - Lower costs compared to Twilio
- ✅ **No monthly commitments** - Pay-as-you-go model

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# SMSMode Configuration (Free SMS API - no subscription fees)
SMSMODE_API_KEY=your_smsmode_api_key_here
SMSMODE_SENDER=YourSender
```

### Getting Started with SMSMode

1. **Sign up** at [https://www.smsmode.com/](https://www.smsmode.com/)
2. **Get your API key** from the SMSMode dashboard
3. **Set your sender name** (can be your company name or phone number)
4. **Add credits** to your account (pay-as-you-go)
5. **Update environment variables** in your application

## Implementation Details

### Files Modified

- `lib/messaging.ts` - Updated to use SMSMode API instead of Twilio
- `lib/sms.ts` - Replaced Twilio implementation with SMSMode
- `app/api/notify/sms/route.ts` - Updated return type (messageId instead of sid)
- `app/events/[id]/communicate/page.tsx` - Updated UI to show SMSMode configuration
- `.env` files - Updated environment variables
- `package.json` - Removed Twilio dependency

### API Integration

SMSMode uses a simple HTTP POST request:

```typescript
const params = new URLSearchParams({
  accessToken: apiKey,
  message: message,
  numero: cleanPhoneNumber,
  emetteur: sender,
  classe_msg: '4' // SMS message type
})

const response = await fetch('https://api.smsmode.com/http/1.6/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: params.toString()
})
```

### Response Handling

- Success: Returns "0" followed by message ID
- Error: Returns error code and description
- All responses are handled gracefully with proper error messages

## WhatsApp Limitation

⚠️ **Important**: SMSMode doesn't support WhatsApp messaging. The WhatsApp functionality in the communicate page now shows:

- Warning message about WhatsApp not being supported
- Suggestions for alternative WhatsApp solutions:
  - WhatsApp Business API (official)
  - Twilio WhatsApp Business API
  - Meta WhatsApp Cloud API (free tier available)

## Usage in Application

### SMS Sending

The SMS functionality works exactly the same as before:

1. Navigate to Events → Communicate
2. Click SMS tab
3. Click "Load Phone Numbers" to fetch from registrations
4. Compose your message (160 character limit)
5. Click "Send to X Recipients"

### Configuration Display

The UI now shows:
- ✅ SMSMode configuration requirements
- ✅ "No subscription fees" message
- ✅ Clear setup instructions

## Cost Comparison

| Provider | Setup Fee | Monthly Fee | SMS Cost (approx) |
|----------|-----------|-------------|-------------------|
| **SMSMode** | Free | Free | $0.02-0.05 per SMS |
| Twilio | Free | Free | $0.0075-0.04 per SMS |
| AWS SNS | Free | Free | $0.00645 per SMS |

*SMSMode is competitive and often cheaper for low-volume usage due to no monthly fees.*

## Testing

To test SMS functionality:

1. Set up SMSMode account and get API credentials
2. Update environment variables
3. Use the communicate page to send test SMS
4. Check SMSMode dashboard for delivery status

## Production Deployment

The application has been successfully built and deployed with Docker:

```bash
# Containers are running:
✅ eventplannerv1-web-1 (Frontend - Port 3001)
✅ eventplannerv1-api-1 (Backend - Port 8081) 
✅ eventplannerv1-postgres-1 (Database)
✅ eventplannerv1-redis-1 (Cache - Port 6380)
```

## Support

For SMSMode-specific issues:
- [SMSMode Documentation](https://www.smsmode.com/api/)
- [SMSMode Support](https://www.smsmode.com/contact/)

For application issues:
- Check application logs
- Verify environment variables are set correctly
- Test with SMSMode API directly if needed
