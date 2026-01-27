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
    const eventPromise = prisma.event.findUnique({
      where: { id: BigInt(eventId) },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo: true,
            _count: {
              select: { events: true }
            }
          }
        },
        speakers: true,
      }
    })

    const [event, registrationCount, sessions] = await Promise.all([
      eventPromise,
      prisma.registration.count({
        where: {
          eventId: BigInt(eventId),
          status: { in: ['APPROVED', 'PENDING'] }
        }
      }),
      prisma.eventSession.findMany({
        where: { eventId: BigInt(eventId) },
        include: {
          speakers: { include: { speaker: true } }
        },
        orderBy: { startTime: 'asc' }
      })
    ])

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const safeEvent = {
      ...event,
      totalSeats: 0, // Placeholder if needed or fetched from floorPlan configs
    }

    const isEnded = safeEvent.endsAt ? new Date(safeEvent.endsAt) < new Date() : false

    // Transform response
    return NextResponse.json({
      id: safeEvent.id.toString(),
      name: safeEvent.name,
      description: safeEvent.description,
      startsAt: safeEvent.startsAt,
      endsAt: safeEvent.endsAt,
      isEnded,
      city: safeEvent.city,
      venue: safeEvent.venue,
      latitude: safeEvent.latitude,
      longitude: safeEvent.longitude,
      eventMode: safeEvent.eventMode,
      status: safeEvent.status,
      bannerUrl: safeEvent.bannerUrl,
      category: safeEvent.category,
      tenantId: safeEvent.tenantId,
      organizerName: safeEvent.tenant?.name,
      organizerLogo: safeEvent.tenant?.logo,
      organizerEventsCount: safeEvent.tenant?._count?.events || 0,
      registrationCount: registrationCount,
      priceInr: safeEvent.priceInr || 0,
      sessions: (sessions || []).map((s: any) => ({ ...s, id: s.id.toString(), eventId: s.eventId.toString() })),
      speakers: (safeEvent.speakers || []).map((s: any) => ({ ...s, id: s.id.toString(), eventId: s.eventId.toString() }))
    })

  } catch (error: any) {
    console.error('❌ Error fetching public event:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch event' },
      { status: 500 }
    )
  }
}
