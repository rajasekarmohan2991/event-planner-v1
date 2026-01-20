import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string, registrationId: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const registrationId = params.registrationId
    const { reason, refundRequested = false } = await req.json().catch(() => ({}))

    console.log(`❌ Cancelling registration ${registrationId} for event ${eventId}`)

    // Get current registration data
    const registrationData = await prisma.$queryRaw`
      SELECT 
        id::text as id,
        data_json,
        email,
        created_at as "createdAt"
      FROM registrations 
      WHERE id = ${registrationId} AND event_id = ${eventId}
      LIMIT 1
    ` as any[]

    if (registrationData.length === 0) {
      return NextResponse.json({ message: 'Registration not found' }, { status: 404 })
    }

    const registration = registrationData[0]
    const currentData = registration.data_json || {}

    // Check if already cancelled
    if (currentData.status === 'CANCELLED') {
      return NextResponse.json({
        message: 'Registration already cancelled',
        cancelledAt: currentData.cancelledAt
      })
    }

    // Update registration with cancellation
    const updatedData = {
      ...currentData,
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      cancelledBy: (session as any)?.user?.id || null,
      cancelReason: reason || 'No reason provided',
      refundRequested: refundRequested || false,
      refundStatus: refundRequested ? 'PENDING' : 'NOT_APPLICABLE'
    }

    await prisma.$executeRaw`
      UPDATE registrations 
      SET data_json = ${JSON.stringify(updatedData)}::jsonb, updated_at = NOW()
      WHERE id = ${registrationId} AND event_id = ${eventId}
    `

    // Send cancellation email
    if (currentData.email) {
      sendEmail({
        to: currentData.email,
        subject: '❌ Registration Cancelled - Event Ticket Void',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px; }
              .notice { background: white; border: 2px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
              .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ef4444; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>❌ Registration Cancelled</h1>
                <p>Your event ticket has been cancelled</p>
              </div>
              <div class="content">
                <p>Hi <strong>${currentData.firstName}</strong>,</p>
                <p>We're writing to inform you that your registration has been <strong>cancelled</strong>.</p>
                
                <div class="notice">
                  <h2>🚫 Cancelled Registration</h2>
                  <div class="info">
                    <strong>Registration ID:</strong> ${registrationId}<br>
                    <strong>Name:</strong> ${currentData.firstName} ${currentData.lastName}<br>
                    <strong>Email:</strong> ${currentData.email}<br>
                    <strong>Status:</strong> <span style="color: #ef4444; font-weight: bold;">CANCELLED</span><br>
                    <strong>Cancelled:</strong> ${new Date().toLocaleString()}
                  </div>
                  
                  <div style="margin: 20px 0; padding: 15px; background: #fee2e2; border-radius: 8px;">
                    <p style="margin: 0; color: #991b1b; font-weight: bold;">
                      ⚠️ This ticket is no longer valid for event entry
                    </p>
                  </div>
                </div>
                
                <div class="info">
                  <strong>📝 Cancellation Reason:</strong><br>
                  ${reason || 'No reason provided'}
                </div>
                
                ${refundRequested ? `
                <div class="info">
                  <strong>💰 Refund Status:</strong> <span style="color: #f59e0b;">PENDING</span><br>
                  Your refund request has been submitted and will be processed according to our refund policy.
                </div>
                ` : ''}
                
                <div class="info">
                  <strong>📞 Questions?</strong> If you have any questions about this cancellation or need assistance, please contact the event organizer.
                </div>
                
                <p>Thank you for your understanding.</p>
                
                <div class="footer">
                  <p>EventPlanner © 2025 | All rights reserved</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Registration Cancelled

Hi ${currentData.firstName},

Your registration has been cancelled.

Registration Details:
- Registration ID: ${registrationId}
- Name: ${currentData.firstName} ${currentData.lastName}
- Status: CANCELLED
- Cancelled: ${new Date().toLocaleString()}

Cancellation Reason: ${reason || 'No reason provided'}

${refundRequested ? 'Refund Status: PENDING - Your refund request will be processed according to our refund policy.' : ''}

This ticket is no longer valid for event entry.

If you have any questions, please contact the event organizer.

EventPlanner © 2025
        `
      }).catch(err => console.error('Cancellation email send failed:', err))
    }

    console.log(`❌ Registration ${registrationId} cancelled successfully`)

    return NextResponse.json({
      success: true,
      message: 'Registration cancelled successfully',
      registration: {
        id: registrationId,
        status: 'CANCELLED',
        cancelledAt: updatedData.cancelledAt,
        cancelledBy: updatedData.cancelledBy,
        cancelReason: updatedData.cancelReason,
        refundRequested: updatedData.refundRequested,
        refundStatus: updatedData.refundStatus
      }
    })

  } catch (error: any) {
    console.error('❌ Registration cancellation error:', error)
    return NextResponse.json({
      message: error?.message || 'Cancellation failed',
      error: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
