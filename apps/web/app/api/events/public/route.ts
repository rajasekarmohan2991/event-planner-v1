import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit') || '10'
    const city = searchParams.get('city') // City filter for location-based events
    const limit = parseInt(limitParam)
    
    console.log('🎫 [PUBLIC EVENTS] Request params:', { limit, city })

    // Test database connection first
    let totalEvents: any[]
    try {
      totalEvents = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM events` as any[]
      console.log('✅ [PUBLIC EVENTS] DB connected. Total events:', totalEvents[0]?.count || 0)
    } catch (dbError: any) {
      console.error('❌ [PUBLIC EVENTS] Database connection failed:', dbError.message)
      throw new Error(`Database connection failed: ${dbError.message}`)
    }

    // Build query with optional city filter
    let events: any[]
    try {
      if (city && city !== 'all') {
        console.log('🌍 [PUBLIC EVENTS] Filtering by city:', city)
        events = await prisma.$queryRaw`
          SELECT 
            e.id::text,
            e.name,
            e.description,
            e.starts_at as "startsAt",
            e.ends_at as "endsAt",
            e.venue,
            e.city,
            e.status,
            e.category,
            e.event_mode as "eventMode",
            e.expected_attendees as "expectedAttendees",
            e.price_inr as "priceInr",
            e.banner_url as "bannerUrl",
            e.created_at as "createdAt",
            e.tenant_id as "tenantId",
            t.name as "organizerName",
            t.logo as "organizerLogo",
            COALESCE(
              (SELECT COUNT(*)::int 
               FROM registrations r 
               WHERE r.event_id = e.id::text 
               AND r.status IN ('CONFIRMED', 'PENDING')),
              0
            ) as "registrationCount"
          FROM events e
          LEFT JOIN tenants t ON e.tenant_id = t.id
          WHERE LOWER(e.city) = LOWER(${city})
          AND e.ends_at > NOW()
          ORDER BY e.starts_at ASC
          LIMIT ${limit}
        ` as any[]
      } else {
        console.log('🌍 [PUBLIC EVENTS] Fetching all cities')
        events = await prisma.$queryRaw`
          SELECT 
            e.id::text,
            e.name,
            e.description,
            e.starts_at as "startsAt",
            e.ends_at as "endsAt",
            e.venue,
            e.city,
            e.status,
            e.category,
            e.event_mode as "eventMode",
            e.expected_attendees as "expectedAttendees",
            e.price_inr as "priceInr",
            e.banner_url as "bannerUrl",
            e.created_at as "createdAt",
            e.tenant_id as "tenantId",
            t.name as "organizerName",
            t.logo as "organizerLogo",
            COALESCE(
              (SELECT COUNT(*)::int 
               FROM registrations r 
               WHERE r.event_id = e.id::text 
               AND r.status IN ('CONFIRMED', 'PENDING')),
              0
            ) as "registrationCount"
          FROM events e
          LEFT JOIN tenants t ON e.tenant_id = t.id
          WHERE e.ends_at > NOW()
          ORDER BY e.starts_at ASC
          LIMIT ${limit}
        ` as any[]
      }
      console.log('✅ [PUBLIC EVENTS] Query successful. Fetched:', events.length)
    } catch (queryError: any) {
      console.error('❌ [PUBLIC EVENTS] Query failed:', queryError.message)
      throw new Error(`Query failed: ${queryError.message}`)
    }

    const formattedEvents = events.map((event: any) => ({
      id: event.id,
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
      tenantId: event.tenantId,
      organizerName: event.organizerName || 'Event Organizer',
      organizerLogo: event.organizerLogo,
      organizerEventsCount: 0,
      registrationCount: event.registrationCount || 0
    }))

    return NextResponse.json({
      events: formattedEvents,
      debug: {
        totalInDb: totalEvents[0]?.count || 0,
        fetchedCount: events.length,
        cityFilter: city || 'all',
        firstEventCity: events[0]?.city,
      }
    })
  } catch (error: any) {
    console.error('❌ [PUBLIC EVENTS] Error:', error)
    console.error('❌ [PUBLIC EVENTS] Error name:', error?.name)
    console.error('❌ [PUBLIC EVENTS] Error message:', error?.message)
    console.error('❌ [PUBLIC EVENTS] Error stack:', error?.stack)
    
    return NextResponse.json({
      error: 'Failed to fetch public events',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        name: error?.name,
        code: error?.code,
        meta: error?.meta
      } : undefined
    }, { status: 500 })
  }
}
