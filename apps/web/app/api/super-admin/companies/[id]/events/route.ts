import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Super Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, start_date, end_date, venue, max_attendees, event_type } = body

    // Create event for the specific company (map fields to Prisma schema)
    const event = await prisma.event.create({
      data: {
        name,
        description,
        startsAt: start_date ? new Date(start_date) : new Date(),
        endsAt: end_date ? new Date(end_date) : new Date(),
        venue,
        expectedAttendees: max_attendees ? parseInt(max_attendees) : null,
        eventMode: event_type || 'OFFLINE',
        status: 'DRAFT',
        tenantId: params.id,
      }
    })

    // Create Calendar Events (Days) if config exists
    if (body.daysConfig && Array.isArray(body.daysConfig)) {
      await prisma.calendarEvent.createMany({
        data: body.daysConfig.map((day: any) => {
          const baseDate = new Date(day.date);
          const [startH, startM] = day.startTime.split(':').map((n: string) => parseInt(n));
          const [endH, endM] = day.endTime.split(':').map((n: string) => parseInt(n));

          const start = new Date(baseDate);
          start.setHours(startH, startM);

          const end = new Date(baseDate);
          end.setHours(endH, endM);

          return {
            eventId: event.id,
            title: day.title,
            startTime: start,
            endTime: end,
            location: venue
          }
        })
      })
    }

    return NextResponse.json({
      success: true,
      event: {
        ...event,
        id: Number(event.id),
      }
    })
  } catch (error: any) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
