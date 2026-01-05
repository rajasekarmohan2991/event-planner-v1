import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)

    // Fetch calendar events for this event
    const calendarEvents = await prisma.$queryRaw`
      SELECT 
        ce.id,
        ce.event_id as "eventId",
        ce.session_id as "sessionId",
        ce.title,
        ce.description,
        ce.start_time as "startTime",
        ce.end_time as "endTime",
        ce.location,
        ce.created_at as "createdAt",
        es.track,
        es.capacity,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', s.id,
                'name', s.name,
                'title', s.title,
                'bio', s.bio
              )
            )
            FROM session_speakers ss
            JOIN speakers s ON s.id = ss.speaker_id
            WHERE ss.session_id = ce.session_id
          ),
          '[]'::json
        ) as speakers
      FROM calendar_events ce
      LEFT JOIN event_sessions es ON es.id = ce.session_id
      WHERE ce.event_id = ${eventId}
      ORDER BY ce.start_time ASC
    `.catch(() => [])

    return NextResponse.json(Array.isArray(calendarEvents) ? calendarEvents : [])
  } catch (error: any) {
    console.error('Error fetching calendar events:', error)
    // Return empty array instead of error for better UX
    return NextResponse.json([])
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const calendarEventId = searchParams.get('calendarEventId')

    if (!calendarEventId) {
      return NextResponse.json({ error: 'Calendar event ID required' }, { status: 400 })
    }

    const eventId = parseInt(params.id)

    // Delete calendar event
    await prisma.$executeRaw`
      DELETE FROM calendar_events 
      WHERE id = ${parseInt(calendarEventId)} AND event_id = ${eventId}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json({ error: 'Failed to delete calendar event' }, { status: 500 })
  }
}
