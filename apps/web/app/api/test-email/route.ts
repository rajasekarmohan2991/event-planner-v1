import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: '✅ Test Email from Event Planner',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">🎉 Email Configuration Successful!</h2>
          <p>Your Event Planner application can now send emails.</p>
          <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>✅ Email Service:</strong> Working</p>
            <p style="margin: 8px 0 0 0;"><strong>📧 Provider:</strong> Ethereal (Test Mode)</p>
          </div>
          <p style="color: #6B7280; font-size: 14px;">
            View all test emails at: <a href="https://ethereal.email/messages">https://ethereal.email/messages</a>
          </p>
        </div>
      `,
      text: 'Email Configuration Successful! Your Event Planner application can now send emails.'
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        messageId: result.messageId,
        previewUrl: result.preview,
        instructions: 'View email at https://ethereal.email/messages (login: oso2u6gnueowrqtx@ethereal.email / 6qUQuZTqCdtd5XxSGy)'
      })
    } else {
      throw new Error('Email sending failed')
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
