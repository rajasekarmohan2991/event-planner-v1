import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit') || '10'
    const limit = parseInt(limitParam)
    console.log('[public events] limit =', limit)

    // DEBUG: Check total count in DB
    const totalInDb = await prisma.event.count()
    console.log('[public events] Total events in DB:', totalInDb)

    // Fetch public events using Prisma Client (safer than raw SQL)
    const events = await prisma.event.findMany({
      // Temporarily remove ALL status filters to see if ANYTHING exists
      // where: {
      //   status: {
      //     notIn: ['TRASHED', 'CANCELLED', 'ARCHIVED']
      //   }
      // },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        },
        _count: {
          select: {
            registrations: {
              where: { status: { in: ['CONFIRMED', 'PENDING'] } }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    console.log('[public events] count =', events.length)

    const formattedEvents = events.map((event: any) => ({
      id: event.id.toString(),
      name: event.name,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      venue: event.venue,
      city: event.city,
      status: event.status,
      category: event.category,
      eventMode: event.eventMode,
      expectedAttendees: event.expectedAttendees,
      priceInr: event.priceInr || 0,
      bannerUrl: event.bannerUrl,
      createdAt: event.createdAt,
      tenantId: event.tenant?.id,
      organizerName: event.tenant?.name || 'Event Organizer',
      organizerLogo: event.tenant?.logo,
      // Calculate organizer events count separately if needed, or default it to 0 for now to save performance
      organizerEventsCount: 0,
      registrationCount: event._count?.registrations || 0
    }))

    return NextResponse.json({
      events: formattedEvents,
      debug: {
        totalInDb,
        fetchedCount: events.length,
        dbStatus: totalInDb > 0 ? 'Data Exists' : 'Database Empty',
        firstEventStatus: events[0]?.status,
      }
    })
  } catch (error: any) {
    console.error('Error fetching public events:', error)
    return NextResponse.json({
      error: 'Failed to fetch public events',
      message: error.message
    }, { status: 500 })
  }
}
