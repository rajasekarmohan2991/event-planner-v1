import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// POST /api/registrations/[id]/cancel-request - User requests cancellation
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const registrationId = BigInt(params.id)
    const body = await req.json()
    const { 
      reason, 
      refundRequested = false, 
      proofUrl = null 
    } = body

    if (!reason) {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 })
    }

    // Get registration details
    const registration = await prisma.$queryRaw<any[]>`
      SELECT 
        r.id,
        r.event_id as "eventId",
        r.status,
        r.data_json as "dataJson",
        e.title as "eventTitle"
      FROM registrations r
      JOIN events e ON e.id = r.event_id
      WHERE r.id = ${registrationId}
      LIMIT 1
    `

    if (!registration || registration.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const reg = registration[0]

    // Check if already cancelled or pending cancellation
    if (reg.status === 'CANCELLED' || reg.status === 'PENDING_CANCELLATION') {
      return NextResponse.json({ 
        error: 'Registration is already cancelled or pending cancellation' 
      }, { status: 400 })
    }

    // Update registration status to pending cancellation
    await prisma.$executeRaw`
      UPDATE registrations
      SET 
        status = 'PENDING_CANCELLATION',
        cancellation_reason = ${reason},
        refund_requested = ${refundRequested},
        cancellation_proof_url = ${proofUrl},
        cancellation_requested_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${registrationId}
    `

    // Send notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@eventplanner.com'
    await sendEmail({
      to: adminEmail,
      subject: `🔔 Cancellation Request - ${reg.eventTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;">Cancellation Request</h2>
          <p>A participant has requested to cancel their registration.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Event:</strong> ${reg.eventTitle}</p>
            <p><strong>Participant:</strong> ${reg.dataJson?.firstName} ${reg.dataJson?.lastName}</p>
            <p><strong>Email:</strong> ${reg.dataJson?.email}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Refund Requested:</strong> ${refundRequested ? 'Yes' : 'No'}</p>
          </div>
          
          <p>Please review this request in the admin panel.</p>
          <a href="${process.env.NEXTAUTH_URL}/events/${reg.eventId}/cancellation-approvals" 
             style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
            Review Cancellation Request
          </a>
        </div>
      `
    }).catch(err => console.error('Failed to send admin notification:', err))

    // Send confirmation to user
    if (reg.dataJson?.email) {
      await sendEmail({
        to: reg.dataJson.email,
        subject: `Cancellation Request Received - ${reg.eventTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Cancellation Request Received</h2>
            <p>Hi ${reg.dataJson.firstName},</p>
            <p>We have received your cancellation request for <strong>${reg.eventTitle}</strong>.</p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>⏳ Status:</strong> Pending Admin Approval</p>
            </div>
            
            <p><strong>Your Request Details:</strong></p>
            <ul>
              <li>Reason: ${reason}</li>
              <li>Refund Requested: ${refundRequested ? 'Yes' : 'No'}</li>
              <li>Requested On: ${new Date().toLocaleString()}</li>
            </ul>
            
            <p>Our team will review your request and get back to you within 24-48 hours.</p>
            <p>Thank you for your patience.</p>
          </div>
        `
      }).catch(err => console.error('Failed to send user confirmation:', err))
    }

    return NextResponse.json({
      success: true,
      message: 'Cancellation request submitted successfully',
      status: 'PENDING_CANCELLATION'
    })
  } catch (error: any) {
    console.error('Error requesting cancellation:', error)
    return NextResponse.json({ error: 'Failed to request cancellation' }, { status: 500 })
  }
}
