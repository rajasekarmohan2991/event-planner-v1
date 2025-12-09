import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { sendSMS } from '@/lib/messaging'
import { generateCalendarLinks } from '@/lib/calendar'

export async function POST(req: NextRequest, { params }: { params: { id: string, eventId: string } }) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const calendarEventId = parseInt(params.eventId)

    // Get calendar event details
    const calendarEvent = await prisma.$queryRaw<any[]>`
      SELECT 
        ce.title,
        ce.description,
        ce.start_time as "startTime",
        ce.end_time as "endTime",
        ce.location,
        e.name as "eventName"
      FROM calendar_events ce
      JOIN events e ON e.id = ce.event_id
      WHERE ce.id = ${calendarEventId} AND ce.event_id = ${eventId}
    `

    if (!calendarEvent || calendarEvent.length === 0) {
      return NextResponse.json({ error: 'Calendar event not found' }, { status: 404 })
    }

    const event = calendarEvent[0]

    // Get all registered users for this event
    const registrations = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT 
        r.email,
        r.phone,
        r.first_name as "firstName",
        r.last_name as "lastName"
      FROM registrations r
      WHERE r.event_id = ${eventId}
        AND r.email IS NOT NULL
    `

    if (registrations.length === 0) {
      return NextResponse.json({ error: 'No registered users found' }, { status: 404 })
    }

    // Generate calendar links
    const calendarLinks = generateCalendarLinks({
      title: event.title,
      description: event.description || '',
      startDate: new Date(event.startTime),
      endDate: new Date(event.endTime),
      location: event.location || '',
      url: `${process.env.NEXTAUTH_URL}/events/${eventId}/calendar`
    })

    // Send notifications to all registered users
    const emailPromises = registrations.map(async (registration) => {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">📅 Session Reminder: ${event.title}</h2>
          
          <p>Hi ${registration.firstName || 'there'},</p>
          
          <p>This is a reminder about an upcoming session for <strong>${event.eventName}</strong>:</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e293b;">${event.title}</h3>
            ${event.description ? `<p style="margin: 0 0 10px 0; color: #64748b;">${event.description}</p>` : ''}
            <p style="margin: 5px 0;"><strong>📅 When:</strong> ${new Date(event.startTime).toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>📍 Where:</strong> ${event.location || 'Location TBD'}</p>
          </div>
          
          <div style="margin: 30px 0;">
            <h4 style="color: #1e293b;">Add to Your Calendar:</h4>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <a href="${calendarLinks.google}" style="background: #4285f4; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">Google Calendar</a>
              <a href="${calendarLinks.outlook}" style="background: #0078d4; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">Outlook</a>
              <a href="${calendarLinks.yahoo}" style="background: #7b0099; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block;">Yahoo</a>
            </div>
          </div>
          
          <p>We look forward to seeing you there!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px;">
            This notification was sent because you're registered for ${event.eventName}.
          </p>
        </div>
      `

      try {
        await sendEmail({
          to: registration.email,
          subject: `📅 Session Reminder: ${event.title}`,
          html: emailContent,
          text: `Session Reminder: ${event.title}\n\nWhen: ${new Date(event.startTime).toLocaleString()}\nWhere: ${event.location || 'Location TBD'}\n\nAdd to calendar: ${calendarLinks.google}`
        })
      } catch (error) {
        console.error(`Failed to send email to ${registration.email}:`, error)
      }
    })

    // Send SMS notifications if phone numbers are available
    const smsPromises = registrations
      .filter(reg => reg.phone)
      .map(async (registration) => {
        const smsText = `📅 Reminder: "${event.title}" session for ${event.eventName} starts ${new Date(event.startTime).toLocaleString()} at ${event.location || 'TBD'}. Add to calendar: ${calendarLinks.google}`
        
        try {
          await sendSMS(registration.phone, smsText)
        } catch (error) {
          console.error(`Failed to send SMS to ${registration.phone}:`, error)
        }
      })

    // Wait for all notifications to complete (best effort)
    await Promise.allSettled([...emailPromises, ...smsPromises])

    return NextResponse.json({ 
      success: true, 
      message: `Notifications sent to ${registrations.length} registered users`,
      emailsSent: registrations.length,
      smsSent: registrations.filter(r => r.phone).length
    })

  } catch (error: any) {
    console.error('Error sending notifications:', error)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}
