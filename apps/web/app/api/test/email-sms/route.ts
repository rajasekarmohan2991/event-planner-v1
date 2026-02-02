import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { sendSMS } from '@/lib/messaging'

export const dynamic = 'force-dynamic'

// POST /api/test/email-sms - Test email and SMS functionality
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, to, subject, message } = body

    const results: any = {
      timestamp: new Date().toISOString(),
      type,
      to,
    }

    if (type === 'email') {
      if (!to || !subject || !message) {
        return NextResponse.json({ error: 'Email requires: to, subject, message' }, { status: 400 })
      }

      console.log('📧 Testing email to:', to)
      const result = await sendEmail({
        to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">Test Email</h2>
            <p>${message}</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 14px;">
              This is a test email from Event Planner V1<br>
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        `,
        text: message
      })

      results.success = result.success
      results.messageId = result.messageId
      results.preview = result.preview
      results.error = result.error

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Email sent successfully!',
          details: results
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'Email sending failed',
          details: results
        }, { status: 500 })
      }
    } else if (type === 'sms') {
      if (!to || !message) {
        return NextResponse.json({ error: 'SMS requires: to, message' }, { status: 400 })
      }

      console.log('📱 Testing SMS to:', to)
      const result = await sendSMS(to, message)

      results.success = result.success
      results.messageId = result.messageId
      results.error = result.error

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'SMS sent successfully!',
          details: results
        })
      } else {
        return NextResponse.json({
          success: false,
          message: 'SMS sending failed',
          details: results
        }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid type. Use "email" or "sms"' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Test API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Test failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

// GET /api/test/email-sms - Get configuration status
export async function GET(req: NextRequest) {
  return NextResponse.json({
    email: {
      configured: !!process.env.EMAIL_SERVER_HOST,
      host: process.env.EMAIL_SERVER_HOST || 'Not configured',
      user: process.env.EMAIL_SERVER_USER ? '✓ Set' : '✗ Not set',
      from: process.env.EMAIL_FROM || 'Not configured'
    },
    sms: {
      twilio: {
        configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
        accountSid: process.env.TWILIO_ACCOUNT_SID ? '✓ Set' : '✗ Not set',
        from: process.env.TWILIO_SMS_FROM || 'Not configured'
      },
      smsmode: {
        configured: !!(process.env.SMSMODE_API_KEY && process.env.SMSMODE_SENDER),
        apiKey: process.env.SMSMODE_API_KEY ? '✓ Set' : '✗ Not set',
        sender: process.env.SMSMODE_SENDER || 'Not configured'
      }
    }
  })
}
