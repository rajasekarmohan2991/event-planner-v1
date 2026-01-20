import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit') || '50'
    const city = searchParams.get('city')
    const limit = parseInt(limitParam)

    console.log('🎫 [PUBLIC EVENTS] Fetching events, city filter:', city || 'all')

    // Build where clause
    const whereClause: any = {
      status: 'PUBLISHED' // Only show published events
    }

    if (city && city !== 'all') {
      whereClause.city = {
        equals: city,
        mode: 'insensitive' // Case-insensitive matching
      }
    }

    // Fetch events using Prisma Client (handles all type conversions)
    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      },
      orderBy: {
        startsAt: 'asc'
      },
      take: limit
    })

    console.log('✅ [PUBLIC EVENTS] Fetched', events.length, 'events')

    // Format events for response
    const formattedEvents = await Promise.all(events.map(async (event: any) => {
      // Count registrations separately to avoid complex joins
      const registrationCount = await prisma.registration.count({
        where: {
          eventId: event.id,
          status: {
            in: ['CONFIRMED', 'PENDING']
          }
        }
      })

      return {
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
        priceInr: event.priceInr ? parseFloat(event.priceInr.toString()) : 0,
        bannerUrl: event.bannerUrl,
        createdAt: event.createdAt,
        tenantId: event.tenant?.id,
        organizerName: event.tenant?.name || 'Event Organizer',
        organizerLogo: event.tenant?.logo,
        organizerEventsCount: 0,
        registrationCount
      }
    }))

    // Get total count for debug
    const totalCount = await prisma.event.count({
      where: { status: 'PUBLISHED' }
    })

    return NextResponse.json({
      events: formattedEvents,
      debug: {
        totalInDb: totalCount,
        fetchedCount: formattedEvents.length,
        cityFilter: city || 'all'
      }
    })
  } catch (error: any) {
    console.error('❌ [PUBLIC EVENTS] Error:', error)
    console.error('❌ [PUBLIC EVENTS] Error message:', error?.message)
    console.error('❌ [PUBLIC EVENTS] Error stack:', error?.stack)

    return NextResponse.json({
      error: 'Failed to fetch public events',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        name: error?.name,
        code: error?.code,
        stack: error?.stack
      } : undefined
    }, { status: 500 })
  }
}
