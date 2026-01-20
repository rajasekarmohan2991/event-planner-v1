import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit') || '10'
    const limit = parseInt(limitParam)
    console.log('[public events] limit =', limit)

    // Fetch public events directly from database with organizer info
    let events = await prisma.$queryRaw<any[]>`
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
        e.tenant_id::text as "tenantId",
        t.name as "organizerName",
        t.logo_url as "organizerLogo",
        (SELECT COUNT(*)::int FROM events WHERE tenant_id = e.tenant_id AND status IN ('PUBLISHED', 'LIVE', 'UPCOMING')) as "organizerEventsCount",
        (SELECT COUNT(*)::int FROM registrations WHERE event_id = e.id AND status IN ('CONFIRMED', 'PENDING')) as "registrationCount"
      FROM public.events e
      LEFT JOIN tenants t ON e.tenant_id = t.id
      WHERE COALESCE(e.status, 'PUBLISHED') NOT IN ('TRASHED', 'CANCELLED', 'ARCHIVED')
      ORDER BY e.created_at DESC
      LIMIT ${limit}
    `

    // Fallback: if no results, try without status filter (exclude trashed/cancelled)
    if (!events || events.length === 0) {
      events = await prisma.$queryRaw<any[]>`
        SELECT 
          e.id::text,
          e.name,
          e.description,
          e.starts_at as "startsAt",
          e.ends_at as "endsAt",
          e.venue,
          e.city,
          e.status,
          e.event_mode as "eventMode",
          e.expected_attendees as "expectedAttendees",
          e.price_inr as "priceInr",
          e.banner_url as "bannerUrl",
          e.created_at as "createdAt",
          e.tenant_id::text as "tenantId",
          t.name as "organizerName",
          t.logo_url as "organizerLogo",
          (SELECT COUNT(*)::int FROM events WHERE tenant_id = e.tenant_id AND status IN ('PUBLISHED', 'LIVE', 'UPCOMING')) as "organizerEventsCount",
          (SELECT COUNT(*)::int FROM registrations WHERE event_id = e.id AND status IN ('CONFIRMED', 'PENDING')) as "registrationCount"
        FROM public.events e
        LEFT JOIN tenants t ON e.tenant_id = t.id
        WHERE COALESCE(e.status,'PUBLISHED') NOT IN ('TRASHED','CANCELLED')
        ORDER BY e.starts_at DESC
        LIMIT ${limit}
      `
    }

    console.log('[public events] rows =', Array.isArray(events) ? events.length : 'n/a')
    const formattedEvents = events.map(event => ({
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
      priceInr: parseFloat(event.priceInr || '0'),
      bannerUrl: event.bannerUrl,
      createdAt: event.createdAt,
      tenantId: event.tenantId,
      organizerName: event.organizerName || 'Event Organizer',
      organizerLogo: event.organizerLogo,
      organizerEventsCount: event.organizerEventsCount || 0,
      registrationCount: event.registrationCount || 0
    }))

    return NextResponse.json({ events: formattedEvents })
  } catch (error: any) {
    console.error('Error fetching public events:', error)
    return NextResponse.json({
      error: 'Failed to fetch public events',
      message: error.message
    }, { status: 500 })
  }
}
