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
    const eventIdBigInt = BigInt(eventId)

    // Fetch event with tenant information from database
    const events = await prisma.$queryRaw<any[]>`
      SELECT 
        e.id::text,
        e.name,
        e.description,
        e.starts_at as "startsAt",
        e.ends_at as "endsAt",
        e.city,
        e.venue,
        e.event_mode as "eventMode",
        e.status,
        e.banner_url as "bannerUrl",
        e.category,
        e.tenant_id::text as "tenantId",
        t.name as "organizerName",
        t.logo_url as "organizerLogo",
        (SELECT COUNT(*)::int FROM events WHERE tenant_id = e.tenant_id AND status IN ('PUBLISHED', 'LIVE', 'UPCOMING')) as "organizerEventsCount"
      FROM events e
      LEFT JOIN tenants t ON e.tenant_id = t.id
      WHERE e.id = ${eventIdBigInt}
      LIMIT 1
    `

    if (!events || events.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const event = events[0]

    // Get registration count
    const registrationCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count
      FROM registrations
      WHERE event_id = ${eventIdBigInt}
      AND status IN ('APPROVED', 'PENDING')
    `

    event.registrationCount = registrationCount[0]?.count || 0

    return NextResponse.json(event)

  } catch (error: any) {
    console.error('❌ Error fetching public event:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to fetch event' },
      { status: 500 }
    )
  }
}
