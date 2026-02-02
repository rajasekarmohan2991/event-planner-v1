import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/invites/respond - Respond to an invite (Interested/Not Interested)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = BigInt(params.id)
    const body = await req.json()
    const { inviteCode, response, additionalInfo } = body

    if (!inviteCode || !response) {
      return NextResponse.json({ error: 'Invite code and response are required' }, { status: 400 })
    }

    if (!['INTERESTED', 'NOT_INTERESTED'].includes(response)) {
      return NextResponse.json({ error: 'Invalid response. Must be INTERESTED or NOT_INTERESTED' }, { status: 400 })
    }

    // Find the invite
    const invite = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        event_id,
        email,
        invitee_name,
        expires_at,
        status,
        response
      FROM event_invites
      WHERE event_id = ${eventId} AND invite_code = ${inviteCode}
      LIMIT 1
    `

    if (!invite || invite.length === 0) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    const inviteData = invite[0]

    // Check if already responded
    if (inviteData.response) {
      return NextResponse.json({ error: 'You have already responded to this invite' }, { status: 400 })
    }

    // Check if expired
    if (new Date(inviteData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 400 })
    }

    // Update invite with response
    await prisma.$executeRaw`
      UPDATE event_invites
      SET 
        response = ${response},
        response_at = CURRENT_TIMESTAMP,
        status = ${response === 'INTERESTED' ? 'RESPONDED_INTERESTED' : 'RESPONDED_NOT_INTERESTED'},
        approval_status = ${response === 'INTERESTED' ? 'PENDING' : 'REJECTED'}
      WHERE id = ${inviteData.id}
    `

    // Get event details for email
    const event = await prisma.$queryRaw<any[]>`
      SELECT name, start_date as "startDate"
      FROM events
      WHERE id = ${eventId}
      LIMIT 1
    `

    const eventDetails = event[0]

    // Send confirmation email to invitee
    if (response === 'INTERESTED') {
      await sendEmail({
        to: inviteData.email,
        subject: `Thank you for your interest in ${eventDetails.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Thank You for Your Interest!</h2>
            <p>Dear ${inviteData.invitee_name || 'Guest'},</p>
            <p>Thank you for expressing interest in attending <strong>${eventDetails.name}</strong>.</p>
            <p>Your response has been received and is now pending approval from the event organizers.</p>
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Our team will review your response</li>
              <li>You will receive an email once your registration is approved</li>
              <li>After approval, you can select your seat and complete payment</li>
            </ul>
            <p>We'll notify you as soon as there's an update on your registration status.</p>
            <p>Best regards,<br>Event Team</p>
          </div>
        `
      })
    } else {
      await sendEmail({
        to: inviteData.email,
        subject: `We're sorry you can't make it to ${eventDetails.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6B7280;">Thank You for Your Response</h2>
            <p>Dear ${inviteData.invitee_name || 'Guest'},</p>
            <p>We're sorry to hear that you won't be able to attend <strong>${eventDetails.name}</strong>.</p>
            <p>We hope to see you at future events!</p>
            <p>Best regards,<br>Event Team</p>
          </div>
        `
      })
    }

    return NextResponse.json({
      success: true,
      message: response === 'INTERESTED' 
        ? 'Thank you! Your interest has been recorded. You will be notified once approved.' 
        : 'Thank you for your response.',
      response,
      requiresApproval: response === 'INTERESTED'
    })
  } catch (error: any) {
    console.error('Error responding to invite:', error)
    return NextResponse.json({ error: 'Failed to process response' }, { status: 500 })
  }
}
