import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Public endpoint to get event details without authentication
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const eventId = params.id
  console.log(`🔍 [PublicAPI] Request for EventID: ${eventId}`)

  if (!eventId || eventId === 'undefined' || eventId === 'null') {
    return NextResponse.json({ message: 'Invalid Event ID' }, { status: 400 })
  }

  let idBigInt: bigint
  try {
    idBigInt = BigInt(eventId)
  } catch (e) {
    console.error(`❌ [PublicAPI] ID is not a valid BigInt: ${eventId}`)
    return NextResponse.json({ message: 'Invalid Event ID format' }, { status: 400 })
  }

  try {
    // 1. Fetch Event with Tenant info
    const eventPromise = prisma.event.findUnique({
      where: { id: idBigInt },
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

    const [event, registrationCount, sessions, promoCodes] = await Promise.all([
      eventPromise,
      prisma.registration.count({
        where: {
          eventId: idBigInt,
          status: { in: ['APPROVED', 'PENDING'] }
        }
      }),
      prisma.eventSession.findMany({
        where: { eventId: idBigInt },
        include: {
          speakers: { include: { speaker: true } }
        },
        orderBy: { startTime: 'asc' }
      }),
      prisma.promoCode.findMany({
        where: {
          eventId: idBigInt,
          isActive: true,
          AND: [
            { OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
            { OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] }
          ]
        },
        select: {
          code: true,
          type: true,
          amount: true,
          description: true
        },
        take: 1
      })
    ])

    if (!event) {
      console.warn(`⚠️ [PublicAPI] Event not found for ID: ${eventId} (BigInt: ${idBigInt})`)
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
      speakers: (safeEvent.speakers || []).map((s: any) => ({ ...s, id: s.id.toString(), eventId: s.eventId.toString() })),
      promoCodes: promoCodes || []
    })

  } catch (error: any) {
    console.error('❌ Error fetching public event:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch event' },
      { status: 500 }
    )
  }
}
