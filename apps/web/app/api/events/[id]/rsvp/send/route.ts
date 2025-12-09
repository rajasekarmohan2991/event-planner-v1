import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/rsvp/send - Send RSVP invitations
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const body = await req.json()
    const { emails } = body // Array of email addresses

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of email addresses' },
        { status: 400 }
      )
    }

    // Get event details
    const eventResult = await prisma.$queryRaw`
      SELECT id, name, start_date, end_date, location, description
      FROM events
      WHERE id = ${eventId}
    ` as any[]

    if (eventResult.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = eventResult[0]
    const sentCount = 0
    const errors: string[] = []

    // Send RSVP to each email
    for (const email of emails) {
      try {
        // Generate unique RSVP token
        const token = crypto.randomBytes(32).toString('hex')

        // Create RSVP response record
        await prisma.$executeRaw`
          INSERT INTO rsvp_responses (
            event_id, email, response, response_token, created_at
          ) VALUES (
            ${eventId}, ${email}, 'YET_TO_RESPOND', ${token}, NOW()
          )
          ON CONFLICT (response_token) DO NOTHING
        `

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
        const attendingUrl = `${baseUrl}/api/rsvp/respond?token=${token}&response=ATTENDING`
        const maybeUrl = `${baseUrl}/api/rsvp/respond?token=${token}&response=MAYBE`
        const notAttendingUrl = `${baseUrl}/api/rsvp/respond?token=${token}&response=NOT_ATTENDING`

        // Send RSVP email
        await sendEmail({
          to: email,
          subject: `RSVP: ${event.name}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .event-details { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; border-left: 4px solid #667eea; }
                .rsvp-buttons { text-align: center; margin: 30px 0; }
                .rsvp-button { display: inline-block; padding: 15px 30px; margin: 10px 5px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
                .btn-attending { background: #10b981; color: white; }
                .btn-maybe { background: #f59e0b; color: white; }
                .btn-not-attending { background: #ef4444; color: white; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📅 You're Invited!</h1>
                  <p>${event.name}</p>
                </div>
                <div class="content">
                  <p>Hello,</p>
                  <p>You're invited to attend <strong>${event.name}</strong>. Please let us know if you'll be joining us!</p>
                  
                  <div class="event-details">
                    <h3>Event Details</h3>
                    <p><strong>📅 Date:</strong> ${new Date(event.start_date).toLocaleDateString()}</p>
                    <p><strong>📍 Location:</strong> ${event.location || 'TBA'}</p>
                    ${event.description ? `<p><strong>ℹ️ About:</strong> ${event.description}</p>` : ''}
                  </div>

                  <div class="rsvp-buttons">
                    <h3>Will you be attending?</h3>
                    <a href="${attendingUrl}" class="rsvp-button btn-attending">✓ Attending</a>
                    <a href="${maybeUrl}" class="rsvp-button btn-maybe">? Maybe</a>
                    <a href="${notAttendingUrl}" class="rsvp-button btn-not-attending">✗ Not Attending</a>
                  </div>

                  <p style="text-align: center; color: #666; font-size: 14px;">
                    Click one of the buttons above to respond to this invitation.
                  </p>

                  <div class="footer">
                    <p>EventPlanner © 2025 | All rights reserved</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
You're Invited to ${event.name}!

Event Details:
- Date: ${new Date(event.start_date).toLocaleDateString()}
- Location: ${event.location || 'TBA'}

Will you be attending?

Respond by clicking one of these links:
- Attending: ${attendingUrl}
- Maybe: ${maybeUrl}
- Not Attending: ${notAttendingUrl}

EventPlanner © 2025
          `
        })

      } catch (error: any) {
        console.error(`Failed to send RSVP to ${email}:`, error)
        errors.push(`${email}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `RSVP invitations sent to ${emails.length} recipients`,
      sent: emails.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('RSVP send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send RSVP invitations' },
      { status: 500 }
    )
  }
}
