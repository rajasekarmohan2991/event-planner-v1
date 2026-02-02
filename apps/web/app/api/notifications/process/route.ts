import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { sendSMS } from '@/lib/messaging'
import { generateCalendarLinks } from '@/lib/calendar'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Get all notifications that should be sent now
    const pendingNotifications = await prisma.$queryRaw<any[]>`
      SELECT 
        ns.id,
        ns.event_id as "eventId",
        ns.session_id as "sessionId",
        ns.notification_type as "notificationType",
        ce.title,
        ce.description,
        ce.start_time as "startTime",
        ce.end_time as "endTime",
        ce.location,
        e.name as "eventName"
      FROM notification_schedule ns
      JOIN calendar_events ce ON ce.id = ns.session_id
      JOIN events e ON e.id = ns.event_id
      WHERE ns.status = 'scheduled'
        AND ns.notification_time <= NOW()
      ORDER BY ns.notification_time ASC
      LIMIT 50
    `

    if (pendingNotifications.length === 0) {
      return NextResponse.json({ message: 'No pending notifications' })
    }

    const processedNotifications = []

    for (const notification of pendingNotifications) {
      try {
        // Mark as processing
        await prisma.$executeRaw`
          UPDATE notification_schedule 
          SET status = 'processing', updated_at = NOW()
          WHERE id = ${notification.id}
        `

        // Get registered users for this event
        const registrations = await prisma.$queryRaw<any[]>`
          SELECT DISTINCT 
            r.data_json->>'email' as email,
            r.data_json->>'phone' as phone,
            r.data_json->>'firstName' as "firstName",
            r.data_json->>'lastName' as "lastName"
          FROM registrations r
          WHERE r.event_id = ${notification.eventId}
            AND r.data_json->>'email' IS NOT NULL
        `

        if (registrations.length > 0) {
          // Generate calendar links
          const calendarLinks = generateCalendarLinks({
            title: notification.title,
            description: notification.description || '',
            startDate: new Date(notification.startTime),
            endDate: new Date(notification.endTime),
            location: notification.location || '',
            url: `${process.env.NEXTAUTH_URL}/events/${notification.eventId}/calendar`
          })

          // Calculate time until session starts
          const timeUntilStart = new Date(notification.startTime).getTime() - new Date().getTime()
          const minutesUntilStart = Math.round(timeUntilStart / (1000 * 60))

          // Send notifications to all registered users
          const emailPromises = registrations.map(async (registration) => {
            const emailContent = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="margin: 0; font-size: 24px;">🔔 Session Starting Soon!</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Your session begins in ${minutesUntilStart} minutes</p>
                </div>
                
                <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p>Hi ${registration.firstName || 'there'},</p>
                  
                  <p>This is a friendly reminder that your session for <strong>${notification.eventName}</strong> is starting soon:</p>
                  
                  <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
                    <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 20px;">${notification.title}</h2>
                    ${notification.description ? `<p style="margin: 0 0 15px 0; color: #64748b;">${notification.description}</p>` : ''}
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                      <div>
                        <div style="font-weight: bold; color: #1e293b; margin-bottom: 5px;">📅 When</div>
                        <div style="color: #64748b;">${new Date(notification.startTime).toLocaleString()}</div>
                      </div>
                      <div>
                        <div style="font-weight: bold; color: #1e293b; margin-bottom: 5px;">📍 Where</div>
                        <div style="color: #64748b;">${notification.location || 'Location TBD'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${calendarLinks.google}" style="background: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px;">📅 Add to Google Calendar</a>
                    <a href="${process.env.NEXTAUTH_URL}/events/${notification.eventId}/calendar" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 5px;">📋 View Full Schedule</a>
                  </div>
                  
                  <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      <strong>⏰ Don't miss it!</strong> The session starts in approximately ${minutesUntilStart} minutes. 
                      Make sure you're ready to join.
                    </p>
                  </div>
                  
                  <p>See you there!</p>
                  
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
                  <p style="color: #64748b; font-size: 12px; text-align: center;">
                    This notification was sent because you're registered for ${notification.eventName}.<br>
                    You can manage your notification preferences in your account settings.
                  </p>
                </div>
              </div>
            `

            try {
              await sendEmail({
                to: registration.email,
                subject: `🔔 Starting Soon: ${notification.title} (${minutesUntilStart} min)`,
                html: emailContent,
                text: `Session Reminder: "${notification.title}" for ${notification.eventName} starts in ${minutesUntilStart} minutes at ${new Date(notification.startTime).toLocaleString()}. Location: ${notification.location || 'TBD'}. Add to calendar: ${calendarLinks.google}`
              })
            } catch (error) {
              console.error(`Failed to send email to ${registration.email}:`, error)
            }
          })

          // Send SMS notifications if phone numbers are available
          const smsPromises = registrations
            .filter(reg => reg.phone)
            .map(async (registration) => {
              const smsText = `🔔 Reminder: "${notification.title}" session for ${notification.eventName} starts in ${minutesUntilStart} minutes at ${notification.location || 'TBD'}. Don't miss it!`
              
              try {
                await sendSMS(registration.phone, smsText)
              } catch (error) {
                console.error(`Failed to send SMS to ${registration.phone}:`, error)
              }
            })

          // Wait for all notifications to complete
          await Promise.allSettled([...emailPromises, ...smsPromises])

          // Mark as sent
          await prisma.$executeRaw`
            UPDATE notification_schedule 
            SET status = 'sent', sent_at = NOW(), updated_at = NOW()
            WHERE id = ${notification.id}
          `

          processedNotifications.push({
            id: notification.id,
            sessionTitle: notification.title,
            recipientCount: registrations.length,
            smsCount: registrations.filter(r => r.phone).length
          })
        } else {
          // Mark as completed (no recipients)
          await prisma.$executeRaw`
            UPDATE notification_schedule 
            SET status = 'completed', updated_at = NOW()
            WHERE id = ${notification.id}
          `
        }

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error)
        
        // Mark as failed
        await prisma.$executeRaw`
          UPDATE notification_schedule 
          SET status = 'failed', error_message = ${(error as Error).message || 'Unknown error'}, updated_at = NOW()
          WHERE id = ${notification.id}
        `
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedNotifications.length} notifications`,
      processed: processedNotifications
    })

  } catch (error: any) {
    console.error('Error processing notifications:', error)
    return NextResponse.json({ error: 'Failed to process notifications' }, { status: 500 })
  }
}
