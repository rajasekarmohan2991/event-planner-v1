import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const tenantId = getTenantId()

    // Get stats using correct database schema
    const eventIdNum = parseInt(eventId)
    
    const [
      registrationsResult, 
      eventResult,
      sessionsResult,
      speakersResult,
      teamResult,
      sponsorsResult
    ] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventIdNum} AND tenant_id = ${tenantId}`.catch(() => [{ count: 0 }]),
      prisma.$queryRaw`SELECT name, starts_at, price_inr, venue, city, address FROM events WHERE id = ${eventIdNum} AND tenant_id = ${tenantId}`.catch(() => []),
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM sessions WHERE event_id = ${eventIdNum} AND tenant_id = ${tenantId}`.catch(() => [{ count: 0 }]),
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM speakers WHERE event_id = ${eventIdNum} AND tenant_id = ${tenantId}`.catch(() => [{ count: 0 }]),
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM event_team_members WHERE event_id = ${eventIdNum} AND tenant_id = ${tenantId}`.catch(() => [{ count: 0 }]),
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM sponsors WHERE event_id = ${eventIdNum} AND tenant_id = ${tenantId}`.catch(() => [{ count: 0 }])
    ])

    const registrations = (registrationsResult as any)[0]?.count || 0
    const event = (eventResult as any)[0] || null
    const sessions = (sessionsResult as any)[0]?.count || 0
    const speakers = (speakersResult as any)[0]?.count || 0
    const team = (teamResult as any)[0]?.count || 0
    const sponsors = (sponsorsResult as any)[0]?.count || 0
    const exhibitors = 0 // Exhibitors table doesn't exist yet
    
    // Calculate ticket sales (basic calculation)
    const ticketSalesInr = registrations * (event?.price_inr || 0)

    // Calculate days to event
    let daysToEvent = null
    if (event?.starts_at) {
      const start = new Date(event.starts_at)
      const now = new Date()
      const diff = start.getTime() - now.getTime()
      daysToEvent = Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return NextResponse.json({
      ticketSalesInr,
      registrations,
      daysToEvent,
      event: {
        name: event?.name,
        startsAt: event?.starts_at,
        priceInr: event?.price_inr,
        venue: event?.venue,
        city: event?.city,
        address: event?.address,
        location: event?.venue || event?.city || event?.address || 'TBD'
      },
      counts: {
        sessions,
        speakers,
        team,
        sponsors,
        exhibitors,
        badges: 0, // Will implement when badges table is available
        registrations
      }
    })
  } catch (e: any) {
    console.error('Stats error:', e)
    return NextResponse.json({
      ticketSalesInr: 0,
      registrations: 0,
      daysToEvent: null,
      counts: { 
        sessions: 0,
        speakers: 0,
        team: 0,
        sponsors: 0,
        exhibitors: 0,
        badges: 0,
        registrations: 0 
      }
    })
  }
}
