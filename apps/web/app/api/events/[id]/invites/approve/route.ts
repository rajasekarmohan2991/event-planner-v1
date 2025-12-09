import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/invites/approve - Approve or reject invite responses
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = BigInt(params.id)
    const body = await req.json()
    const { inviteId, approvalStatus, approvalType, rejectionReason } = body

    if (!inviteId || !approvalStatus) {
      return NextResponse.json({ error: 'Invite ID and approval status are required' }, { status: 400 })
    }

    if (!['APPROVED', 'REJECTED'].includes(approvalStatus)) {
      return NextResponse.json({ error: 'Invalid approval status' }, { status: 400 })
    }

    if (approvalStatus === 'APPROVED' && !approvalType) {
      return NextResponse.json({ error: 'Approval type is required (FULL or PARTIAL)' }, { status: 400 })
    }

    const userId = (session as any).user?.id ? BigInt((session as any).user.id) : null

    // Get invite details
    const invite = await prisma.$queryRaw<any[]>`
      SELECT 
        ei.id,
        ei.event_id,
        ei.email,
        ei.invitee_name,
        ei.response,
        ei.approval_status,
        ei.invite_code as "inviteCode",
        e.name as event_name,
        e.start_date as event_start
      FROM event_invites ei
      JOIN events e ON e.id = ei.event_id
      WHERE ei.id = ${BigInt(inviteId)} AND ei.event_id = ${eventId}
      LIMIT 1
    `

    if (!invite || invite.length === 0) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    const inviteData = invite[0]

    if (inviteData.response !== 'INTERESTED') {
      return NextResponse.json({ error: 'Can only approve invites with INTERESTED response' }, { status: 400 })
    }

    // Update invite approval status
    await prisma.$executeRaw`
      UPDATE event_invites
      SET 
        approval_status = ${approvalStatus},
        approval_type = ${approvalType || null},
        approved_by = ${userId},
        approved_at = CURRENT_TIMESTAMP,
        rejection_reason = ${rejectionReason || null},
        status = ${approvalStatus === 'APPROVED' ? 'APPROVED' : 'REJECTED'}
      WHERE id = ${inviteData.id}
    `

    // Send email notification
    if (approvalStatus === 'APPROVED') {
      // Use the invite_code and existing register-with-seats flow
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3001'
      const seatSelectionUrl = `${baseUrl.replace(/\/$/, '')}/events/${params.id}/register-with-seats?invite=${encodeURIComponent(inviteData.inviteCode)}`
      
      await sendEmail({
        to: inviteData.email,
        subject: `✅ Your registration for ${inviteData.event_name} has been approved!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">🎉 Registration Approved!</h2>
            <p>Dear ${inviteData.invitee_name || 'Guest'},</p>
            <p>Great news! Your registration for <strong>${inviteData.event_name}</strong> has been approved.</p>
            
            <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Approval Type:</strong> ${approvalType === 'FULL' ? 'Full Access' : 'Partial Access'}</p>
              ${approvalType === 'PARTIAL' ? '<p style="margin: 5px 0; color: #F59E0B;">⚠️ Limited seats available based on capacity</p>' : ''}
            </div>

            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Select your preferred seat</li>
              <li>Complete the payment</li>
              <li>Receive your QR code and confirmation</li>
            </ol>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${seatSelectionUrl}" style="background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Select Your Seat
              </a>
            </div>

            <p style="color: #6B7280; font-size: 14px;">This link is unique to your registration. Please do not share it.</p>
            <p>Best regards,<br>Event Team</p>
          </div>
        `
      })
    } else {
      await sendEmail({
        to: inviteData.email,
        subject: `Registration Update for ${inviteData.event_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #EF4444;">Registration Status Update</h2>
            <p>Dear ${inviteData.invitee_name || 'Guest'},</p>
            <p>We regret to inform you that your registration for <strong>${inviteData.event_name}</strong> could not be approved at this time.</p>
            
            ${rejectionReason ? `
              <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
                <p style="margin: 0;"><strong>Reason:</strong> ${rejectionReason}</p>
              </div>
            ` : ''}

            <p>This may be due to capacity constraints or other event-specific requirements.</p>
            <p>We hope to see you at future events!</p>
            <p>Best regards,<br>Event Team</p>
          </div>
        `
      })
    }

    return NextResponse.json({
      success: true,
      message: approvalStatus === 'APPROVED' 
        ? `Registration approved (${approvalType}). Email sent to invitee.` 
        : 'Registration rejected. Email sent to invitee.',
      approvalStatus,
      approvalType
    })
  } catch (error: any) {
    console.error('Error approving invite:', error)
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 })
  }
}
