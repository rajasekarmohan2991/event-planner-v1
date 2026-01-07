import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const eventId = BigInt(params.id)

    // Get event details for days calculation
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { starts_at: true }
    })

    // Calculate days to event
    const daysToEvent = event?.starts_at
      ? Math.ceil((new Date(event.starts_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null

    // Get counts using raw queries for better performance
    const [
      registrations,
      sessions,
      speakers,
      team,
      sponsors,
      exhibitors,
      promos,
      ticketSales
    ] = await Promise.all([
      // Registrations count
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM registrations WHERE event_id = ${eventId.toString()}
      `.then(r => Number(r[0]?.count || 0)),

      // Sessions count
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM sessions WHERE event_id = ${eventId}
      `.then(r => Number(r[0]?.count || 0)),

      // Speakers count
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM speakers WHERE event_id = ${eventId}
      `.then(r => Number(r[0]?.count || 0)),

      // Team members count
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM event_team_members WHERE event_id = ${eventId}
      `.then(r => Number(r[0]?.count || 0)),

      // Sponsors count
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM sponsor_registrations WHERE event_id = ${eventId}
      `.then(r => Number(r[0]?.count || 0)).catch(() => 0),

      // Exhibitors count
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM exhibitor_registrations WHERE event_id = ${eventId}
      `.then(r => Number(r[0]?.count || 0)).catch(() => 0),

      // Promo codes count
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM promo_codes WHERE event_id = ${eventId.toString()}
      `.then(r => Number(r[0]?.count || 0)).catch(() => 0),

      // Ticket sales total
      prisma.$queryRaw<[{ total: number | null }]>`
        SELECT COALESCE(SUM(total_amount), 0) as total 
        FROM registrations 
        WHERE event_id = ${eventId.toString()} AND payment_status = 'PAID'
      `.then(r => Number(r[0]?.total || 0))
    ])

    return NextResponse.json({
      ticketSalesInr: ticketSales,
      registrations,
      daysToEvent,
      counts: {
        sessions,
        speakers,
        team,
        sponsors,
        exhibitors,
        promos
      }
    })

  } catch (error: any) {
    console.error('Stats API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch stats',
      details: error.message
    }, { status: 500 })
  }
}
