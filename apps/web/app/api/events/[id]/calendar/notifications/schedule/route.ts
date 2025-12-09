import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const { reminderMinutes = 15 } = await req.json()

    // Get all upcoming sessions for this event
    const upcomingSessions = await prisma.$queryRaw<any[]>`
      SELECT 
        ce.id,
        ce.title,
        ce.start_time as "startTime",
        ce.end_time as "endTime",
        ce.location,
        e.name as "eventName"
      FROM calendar_events ce
      JOIN events e ON e.id = ce.event_id
      WHERE ce.event_id = ${eventId}
        AND ce.start_time > NOW()
      ORDER BY ce.start_time ASC
    `

    if (upcomingSessions.length === 0) {
      return NextResponse.json({ message: 'No upcoming sessions found' })
    }

    // Schedule notifications for each session
    const scheduledNotifications = []
    
    for (const session of upcomingSessions) {
      const sessionStart = new Date(session.startTime)
      const notificationTime = new Date(sessionStart.getTime() - (reminderMinutes * 60 * 1000))
      
      // Only schedule if notification time is in the future
      if (notificationTime > new Date()) {
        // Store notification schedule in database
        await prisma.$executeRaw`
          INSERT INTO notification_schedule (
            event_id, 
            session_id, 
            notification_time, 
            notification_type, 
            status,
            created_at
          ) VALUES (
            ${eventId},
            ${session.id},
            ${notificationTime},
            'session_reminder',
            'scheduled',
            NOW()
          )
          ON CONFLICT (event_id, session_id, notification_type) 
          DO UPDATE SET 
            notification_time = EXCLUDED.notification_time,
            status = 'scheduled',
            updated_at = NOW()
        `
        
        scheduledNotifications.push({
          sessionId: session.id,
          sessionTitle: session.title,
          notificationTime: notificationTime.toISOString(),
          minutesBefore: reminderMinutes
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scheduled ${scheduledNotifications.length} notifications`,
      notifications: scheduledNotifications
    })

  } catch (error: any) {
    console.error('Error scheduling notifications:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'No sessions available to schedule notifications', 
      notifications: [] 
    })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)

    // Get scheduled notifications for this event
    const scheduledNotifications = await prisma.$queryRaw<any[]>`
      SELECT 
        ns.id,
        ns.session_id as "sessionId",
        ns.notification_time as "notificationTime",
        ns.notification_type as "notificationType",
        ns.status,
        ce.title as "sessionTitle",
        ce.start_time as "sessionStartTime"
      FROM notification_schedule ns
      JOIN calendar_events ce ON ce.id = ns.session_id
      WHERE ns.event_id = ${eventId}
        AND ns.status IN ('scheduled', 'sent')
      ORDER BY ns.notification_time ASC
    `

    return NextResponse.json(scheduledNotifications)

  } catch (error: any) {
    console.error('Error fetching scheduled notifications:', error)
    // Return empty array instead of error
    return NextResponse.json([])
  }
}
