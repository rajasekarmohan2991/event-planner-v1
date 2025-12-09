import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = searchParams.get('limit') || '10'
    const limit = parseInt(limitParam)
    console.log('[public events] limit =', limit)
    
    // Fetch public events directly from database
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
        e.event_mode as "eventMode",
        e.expected_attendees as "expectedAttendees",
        e.price_inr as "priceInr",
        e.banner_url as "bannerUrl",
        e.created_at as "createdAt"
      FROM public.events e
      WHERE COALESCE(e.status,'PUBLISHED') IN ('PUBLISHED','LIVE','UPCOMING')
      ORDER BY e.starts_at DESC
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
          e.created_at as "createdAt"
        FROM public.events e
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
      eventMode: event.eventMode,
      expectedAttendees: event.expectedAttendees,
      priceInr: parseFloat(event.priceInr || '0'),
      bannerUrl: event.bannerUrl,
      createdAt: event.createdAt
    }))

    return NextResponse.json(formattedEvents)
  } catch (error: any) {
    console.error('Error fetching public events:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch public events',
      message: error.message 
    }, { status: 500 })
  }
}
