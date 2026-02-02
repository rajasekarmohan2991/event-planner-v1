import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any)?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    // Allow all authenticated users to send invites for now
    // TODO: Add proper event role checking

    const { emails, subject, message, eventUrl } = await req.json()

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'emails array is required' }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({ error: 'subject and message are required' }, { status: 400 })
    }

    // Get event details
    const eventRes = await fetch(`http://api:8080/api/events/${eventId}`)
    const event = eventRes.ok ? await eventRes.json() : null

    const eventName = event?.name || 'Our Event'
    const eventDate = event?.startTime ? new Date(event.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'TBD'
    const eventVenue = event?.venue || 'TBD'

    // Send invites
    let sent = 0
    const errors: string[] = []

    for (const email of emails) {
      const trimmedEmail = email.trim()
      if (!trimmedEmail) continue

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">${eventName}</h2>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0; color: #4b5563;">
                <strong>📅 Date:</strong> ${eventDate}
              </p>
              <p style="margin: 10px 0; color: #4b5563;">
                <strong>📍 Location:</strong> ${eventVenue}
              </p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6;">
              ${message.split('\n').map((line: string) => `${line}<br>`).join('')}
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${eventUrl || `http://localhost:3001/events/${eventId}/public`}" 
                 style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Event & Register
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
              You received this invitation because someone thought you'd be interested in this event.
            </p>
          </div>
        </div>
      `

      const result = await sendEmail({
        to: trimmedEmail,
        subject,
        html,
        text: `${subject}\n\n${message}\n\nView event: ${eventUrl || `http://localhost:3001/events/${eventId}/public`}`
      })

      if (result.success) {
        sent++
      } else {
        errors.push(`Failed to send to ${trimmedEmail}`)
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      total: emails.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (err: any) {
    console.error('Invite error:', err)
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 })
  }
}
