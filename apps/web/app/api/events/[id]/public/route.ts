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
    const safeEvent = event as any // Temporary cast to handle dynamic includes until types are auto-generated
    return NextResponse.json({
      id: safeEvent.id.toString(),
      name: safeEvent.name,
      description: safeEvent.description,
      startsAt: safeEvent.startsAt,
      endsAt: safeEvent.endsAt,
      city: safeEvent.city,
      venue: safeEvent.venue,
      eventMode: safeEvent.eventMode,
      status: safeEvent.status,
      bannerUrl: safeEvent.banner,
      category: safeEvent.category,
      tenantId: safeEvent.tenantId,
      organizerName: safeEvent.tenant?.name,
      organizerLogo: safeEvent.tenant?.logo,
      organizerEventsCount: safeEvent.tenant?._count?.events || 0,
      registrationCount: safeEvent._count?.registrations || 0,
      sessions: (safeEvent.sessions || []).map((s: any) => ({ ...s, id: s.id.toString(), eventId: s.eventId.toString() })),
      speakers: (safeEvent.speakers || []).map((s: any) => ({ ...s, id: s.id.toString(), eventId: s.eventId.toString() }))
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
