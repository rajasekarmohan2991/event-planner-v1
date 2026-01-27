import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Public endpoint to get event details without authentication
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id

  try {
    // 1. Fetch Event with Tenant info
    const event = await prisma.event.findUnique({
      where: { id: BigInt(eventId) },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo: true, // Assuming field is 'logo' based on previous schema view, or 'logoUrl' if mapped
            _count: {
              select: { events: true }
            }
          }
        },
        sessions: {
          orderBy: { startTime: 'asc' }
        },
        speakers: true,
        _count: {
          select: {
            registrations: {
              where: { status: { in: ['APPROVED', 'PENDING'] } }
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    // Transform response
    return NextResponse.json({
      id: event.id.toString(),
      name: event.name,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      city: event.city,
      // venue: event.venue, // Warning: Venue might be a relation or string, assume relation check later or string
      eventMode: event.eventMode,
      status: event.status,
      bannerUrl: event.banner,
      category: event.category,
      tenantId: event.tenantId,
      organizerName: event.tenant?.name,
      organizerLogo: event.tenant?.logo,
      organizerEventsCount: event.tenant?._count.events || 0,
      registrationCount: event._count.registrations,
      sessions: event.sessions.map(s => ({ ...s, id: s.id.toString(), eventId: s.eventId.toString() })),
      speakers: event.speakers.map(s => ({ ...s, id: s.id.toString(), eventId: s.eventId.toString() }))
    })

    return NextResponse.json(event)

  } catch (error: any) {
    console.error('❌ Error fetching public event:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch event' },
      { status: 500 }
    )
  }
}
