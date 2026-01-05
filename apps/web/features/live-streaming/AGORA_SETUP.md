# Agora.io Setup Guide

Complete guide to set up Agora.io for live streaming functionality.

## Step 1: Create Agora Account

1. Go to [https://console.agora.io](https://console.agora.io)
2. Click "Sign Up" (or "Get Started")
3. Fill in your details:
   - Email address
   - Password
   - Company name (can be your event company name)
4. Verify your email
5. Complete the registration

## Step 2: Create a Project

1. After logging in, you'll see the Agora Console
2. Click "Create Project" or "Project Management" → "Create"
3. Fill in project details:
   - **Project Name**: "Event Planner Live Streaming" (or your choice)
   - **Use Case**: Select "Live Broadcasting"
   - **Authentication**: Select "Secured mode: APP ID + Token"
4. Click "Submit"

## Step 3: Get Your Credentials

After creating the project, you'll see:

### App ID
- This is your public identifier
- Copy this value
- Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### App Certificate
- Click "Enable" next to "Primary Certificate"
- A certificate will be generated
- Copy this value (keep it secret!)
- Example: `z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4`

## Step 4: Add to Environment Variables

### For Vercel (Production)

1. Go to your Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:

```
NEXT_PUBLIC_AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_certificate_here
```

5. Click "Save"
6. Redeploy your application

### For Local Development (Optional)

Create/update `.env.local`:

```bash
NEXT_PUBLIC_AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_certificate_here
```

## Step 5: Verify Setup

Test that credentials are working:

1. Go to your event
2. Navigate to a session
3. Click "Stream" or access: `/events/[id]/sessions/[sessionId]/stream`
4. Click "Setup Stream"
5. You should see RTMP credentials generated

If you see an error "Streaming not configured", check that:
- Environment variables are set correctly
- You've redeployed after adding variables
- Variable names match exactly (case-sensitive)

## Pricing & Limits

### Free Tier (Perfect for Testing)
- ✅ 10,000 minutes per month FREE
- ✅ Unlimited projects
- ✅ Full features access
- ✅ No credit card required

### Usage Calculation
- 1 hour stream with 10 viewers = 10 hours of usage
- 1 hour stream with 100 viewers = 100 hours of usage

### Paid Plans (When You Scale)
After free tier:
- **Standard**: $0.99 per 1,000 minutes
- **Premium**: Custom pricing for high volume

## Features Included

With your Agora setup, you get:

✅ **RTMP Streaming**
- Stream from OBS, Streamyard, etc.
- Professional broadcasting tools

✅ **Real-time Video**
- Low latency (1-2 seconds)
- HD quality support

✅ **Recording**
- Automatic cloud recording
- Download recordings later

✅ **Analytics**
- Viewer count tracking
- Quality metrics
- Usage statistics

✅ **Global CDN**
- Fast delivery worldwide
- 200+ data centers

## Security Best Practices

### DO:
✅ Keep App Certificate secret
✅ Use environment variables
✅ Enable token authentication
✅ Rotate certificates periodically

### DON'T:
❌ Commit credentials to git
❌ Share certificates publicly
❌ Use same credentials across projects
❌ Disable token authentication

## Testing Your Setup

### Test 1: Generate Credentials
```bash
# Should return RTMP URL and Stream Key
curl -X POST https://your-app.vercel.app/api/features/streaming/setup \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "1", "eventId": "1"}'
```

### Test 2: Get Token
```bash
# Should return Agora token
curl https://your-app.vercel.app/api/features/streaming/token?streamId=xxx
```

### Test 3: Stream with OBS
1. Open OBS Studio
2. Go to Settings → Stream
3. Service: Custom
4. Server: Your RTMP URL
5. Stream Key: Your Stream Key
6. Click "Start Streaming"
7. Should connect successfully

## Troubleshooting

### Error: "Invalid App ID"
- Check that App ID is correct
- Verify no extra spaces
- Ensure NEXT_PUBLIC_ prefix for client-side variable

### Error: "Token generation failed"
- Check App Certificate is set
- Verify certificate is correct
- Ensure no quotes around values

### Error: "Connection refused"
- Check internet connection
- Verify firewall settings
- Try different RTMP server

### Stream not appearing
- Verify stream status is "live"
- Check viewer has valid token
- Ensure correct channel name

## Support Resources

- **Agora Documentation**: https://docs.agora.io
- **API Reference**: https://api-ref.agora.io
- **Community Forum**: https://community.agora.io
- **Support Email**: support@agora.io

## Next Steps

After setup is complete:

1. ✅ Test streaming with OBS
2. ✅ Invite team members to test viewing
3. ✅ Configure recording settings
4. ✅ Set up access control
5. ✅ Go live with your first event!

---

**Need Help?**
- Check Agora Console for usage stats
- Review logs in Vercel dashboard
- Test with Agora's demo apps first
