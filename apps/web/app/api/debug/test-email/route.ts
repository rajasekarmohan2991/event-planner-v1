import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

/**
 * Test Email Endpoint
 * GET /api/debug/test-email?to=your@email.com
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const to = searchParams.get('to')

        if (!to) {
            return NextResponse.json({
                error: 'Missing "to" parameter',
                usage: '/api/debug/test-email?to=your@email.com'
            }, { status: 400 })
        }

        console.log('🧪 [TEST EMAIL] Sending test email to:', to)
        console.log('🧪 [TEST EMAIL] Environment check:', {
            hasSmtpHost: !!process.env.SMTP_HOST,
            hasSmtpUser: !!process.env.SMTP_USER,
            hasSmtpPassword: !!process.env.SMTP_PASSWORD,
            smtpHost: process.env.SMTP_HOST,
            smtpPort: process.env.SMTP_PORT,
            smtpSecure: process.env.SMTP_SECURE,
            emailFrom: process.env.EMAIL_FROM,
            hasSendGridKey: !!process.env.SENDGRID_API_KEY
        })

        const result = await sendEmail({
            to,
            subject: '🧪 Test Email from Event Planner',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                        🧪 Test Email Successful!
                      </h1>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
                        Hi there! 👋
                      </p>
                      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
                        This is a test email from your Event Planner application.
                      </p>
                      <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
                        If you're receiving this, it means your email configuration is working correctly! ✅
                      </p>
                      <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 0; color: #1e40af; font-size: 14px;">
                          <strong>Configuration Details:</strong><br>
                          SMTP Host: ${process.env.SMTP_HOST || 'Not configured'}<br>
                          SMTP Port: ${process.env.SMTP_PORT || 'Not configured'}<br>
                          From: ${process.env.EMAIL_FROM || 'Not configured'}<br>
                          Sent at: ${new Date().toISOString()}
                        </p>
                      </div>
                      <p style="margin: 0; color: #666; font-size: 14px;">
                        Thanks,<br>Event Planner Team
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
            text: `
Test Email from Event Planner

Hi there!

This is a test email from your Event Planner application.

If you're receiving this, it means your email configuration is working correctly!

Configuration Details:
- SMTP Host: ${process.env.SMTP_HOST || 'Not configured'}
- SMTP Port: ${process.env.SMTP_PORT || 'Not configured'}
- From: ${process.env.EMAIL_FROM || 'Not configured'}
- Sent at: ${new Date().toISOString()}

Thanks,
Event Planner Team
      `
        })

        console.log('✅ [TEST EMAIL] Email sent successfully:', result)

        return NextResponse.json({
            success: true,
            message: 'Test email sent successfully!',
            to,
            result: {
                messageId: result.messageId,
                preview: result.preview,
                isEthereal: !!result.preview
            },
            configuration: {
                smtpHost: process.env.SMTP_HOST,
                smtpPort: process.env.SMTP_PORT,
                smtpSecure: process.env.SMTP_SECURE,
                emailFrom: process.env.EMAIL_FROM,
                hasSendGridBackup: !!process.env.SENDGRID_API_KEY
            },
            warning: result.preview ?
                '⚠️ Using Ethereal test account - email NOT sent to real address. Check SMTP configuration!' :
                undefined
        })

    } catch (error: any) {
        console.error('❌ [TEST EMAIL] Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
            configuration: {
                smtpHost: process.env.SMTP_HOST,
                smtpPort: process.env.SMTP_PORT,
                hasSmtpUser: !!process.env.SMTP_USER,
                hasSmtpPassword: !!process.env.SMTP_PASSWORD,
                emailFrom: process.env.EMAIL_FROM
            }
        }, { status: 500 })
    }
}
