import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/invites - Get all invites for an event
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = BigInt(params.id)

    const invites = await prisma.$queryRaw<any[]>`
      SELECT 
        id::text,
        email,
        invitee_name as "inviteeName",
        organization,
        category,
        discount_code as "discountCode",
        invite_code as "inviteCode",
        invited_at as "invitedAt",
        expires_at as "expiresAt",
        used_at as "usedAt",
        registration_id::text as "registrationId",
        status
      FROM event_invites
      WHERE event_id = ${eventId}
      ORDER BY invited_at DESC
    `

    return NextResponse.json({ invites })
  } catch (error: any) {
    console.error('Error fetching invites:', error)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }
}

// POST /api/events/[id]/invites - Send invites
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = BigInt(params.id)
    const body = await req.json()
    const { invitees, expiresInDays = 30 } = body

    // Support both old format (emails array) and new format (invitees array)
    const inviteeList = invitees || (body.emails || []).map((email: string) => ({ email }))

    if (!inviteeList || !Array.isArray(inviteeList) || inviteeList.length === 0) {
      return NextResponse.json({ error: 'Invitees array is required' }, { status: 400 })
    }

    const userId = (session as any).user?.id ? BigInt((session as any).user.id) : null
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // Get event details
    const event = await prisma.$queryRaw<any[]>`
      SELECT 
        id, 
        name as title, 
        starts_at as "startDate",
        ends_at as "endDate",
        venue,
        address,
        description
      FROM events
      WHERE id = ${eventId}
      LIMIT 1
    `

    if (!event || event.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const eventDetails = event[0]
    const invitesSent = []

    for (const invitee of inviteeList) {
      const { email, name, organization, category, discountCode } = invitee
      const inviteCode = crypto.randomBytes(16).toString('hex')
      const inviteId = crypto.randomUUID()

      try {
        // Insert invite
        await prisma.$executeRaw`
          INSERT INTO event_invites (id, event_id, email, invitee_name, organization, category, discount_code, invite_code, invited_by, expires_at, status)
          VALUES (${inviteId}, ${eventId}, ${email}, ${name || null}, ${organization || null}, ${category || 'General'}, ${discountCode || null}, ${inviteCode}, ${userId}, ${expiresAt}, 'PENDING')
          ON CONFLICT (event_id, email) 
          DO UPDATE SET 
            invitee_name = ${name || null},
            organization = ${organization || null},
            category = ${category || 'General'},
            discount_code = ${discountCode || null},
            invite_code = ${inviteCode},
            invited_at = CURRENT_TIMESTAMP,
            expires_at = ${expiresAt},
            status = 'PENDING',
            used_at = NULL
        `

        // Send invite email (build robust absolute URL)
        const baseUrl = ((process.env.NEXTAUTH_URL || req.nextUrl.origin) || '').replace(/\/$/, '')
        const responseUrl = `${baseUrl}/events/${eventId}/invite-response?code=${inviteCode}`

        await sendEmail({
          to: email,
          subject: `🎟️ You're Invited: ${eventDetails.title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .invite-code { background: #fff; border: 2px dashed #667eea; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #667eea; margin: 20px 0; border-radius: 5px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 You're Invited!</h1>
                  <p style="font-size: 18px; margin: 10px 0 0 0;">Exclusive Invitation to ${eventDetails.title}</p>
                </div>
                <div class="content">
                  <p>Hello${name ? ` ${name}` : ''},</p>
                  <p>You have been personally invited to attend an exclusive event:</p>
                  
                  <h2 style="color: #667eea; margin: 20px 0;">${eventDetails.title}</h2>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>📅 Date:</strong> ${eventDetails.startDate ? new Date(eventDetails.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}</p>
                    <p><strong>🕐 Time:</strong> ${eventDetails.startDate ? new Date(eventDetails.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBD'}${eventDetails.endDate ? ` - ${new Date(eventDetails.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
                    <p><strong>📍 Location:</strong> ${eventDetails.venue || eventDetails.address || 'TBD'}</p>
                    ${category ? `<p><strong>🎫 Category:</strong> ${category}</p>` : ''}
                    ${organization ? `<p><strong>🏢 Organization:</strong> ${organization}</p>` : ''}
                    ${discountCode ? `<p><strong>💰 Discount Code:</strong> <code style="background: #f0f0f0; padding: 2px 8px; border-radius: 3px;">${discountCode}</code></p>` : ''}
                  </div>
                  
                  <p><strong>Please let us know if you're interested in attending:</strong></p>
                  
                  <div style="text-align: center;">
                    <a href="${responseUrl}" class="button">Respond to Invitation →</a>
                  </div>
                  
                  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                    <strong>📋 Registration Process:</strong><br>
                    1. Click the button above to indicate your interest<br>
                    2. Wait for approval from our team<br>
                    3. Select your preferred seat<br>
                    4. Complete payment<br>
                    5. Receive your QR code and confirmation
                  </p>
                  
                  <p style="margin-top: 20px;">
                    <strong>⚠️ Important:</strong><br>
                    • This invite expires on ${expiresAt.toLocaleDateString()}<br>
                    • Please respond as soon as possible<br>
                    • Approval is subject to availability
                  </p>
                  
                  <p>If you have any questions, please contact the event organizer.</p>
                  
                  <p>We look forward to seeing you!</p>
                </div>
                <div class="footer">
                  <p>This is an automated invitation. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
You're Invited to ${eventDetails.title}!

Event Date: ${new Date(eventDetails.startDate).toLocaleDateString()}
Location: ${eventDetails.venue || eventDetails.address || 'TBD'}

This is an invite-only event. Use your unique invite code to register:

Invite Code: ${inviteCode}

Register here: ${responseUrl}

This invite expires on ${expiresAt.toLocaleDateString()}.

Important:
- The invite code can only be used once
- Registration is subject to admin approval
- Payment will be required to complete registration
          `
        }).catch(err => console.error(`Failed to send invite to ${email}:`, err))

        invitesSent.push({ email, name, organization, category, discountCode, inviteCode })
      } catch (err) {
        console.error(`Failed to create invite for ${email}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${invitesSent.length} invite(s) sent successfully`,
      invites: invitesSent
    })
  } catch (error: any) {
    console.error('Error sending invites:', error)
    return NextResponse.json({ error: 'Failed to send invites' }, { status: 500 })
  }
}

// DELETE /api/events/[id]/invites?inviteId=123 - Revoke an invite
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const inviteId = url.searchParams.get('inviteId')

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID is required' }, { status: 400 })
    }

    await prisma.$executeRaw`
      UPDATE event_invites
      SET status = 'REVOKED'
      WHERE id = ${BigInt(inviteId)}
    `

    return NextResponse.json({ success: true, message: 'Invite revoked' })
  } catch (error: any) {
    console.error('Error revoking invite:', error)
    return NextResponse.json({ error: 'Failed to revoke invite' }, { status: 500 })
  }
}
