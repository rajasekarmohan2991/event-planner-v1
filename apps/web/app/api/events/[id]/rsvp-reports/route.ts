import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = BigInt(params.id)

    // Get all RSVP interests
    const rsvps = await prisma.$queryRaw<any[]>`
      SELECT 
        id::text,
        name,
        email,
        response_type as "responseType",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM rsvp_interests
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
    `

    // Get stats
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        response_type,
        COUNT(*)::int as count
      FROM rsvp_interests
      WHERE event_id = ${eventId}
      GROUP BY response_type
    `

    const summary = {
      going: 0,
      maybe: 0,
      notGoing: 0,
      pending: 0,
      total: 0
    }

    stats.forEach((row: any) => {
      const type = row.response_type?.toUpperCase()
      if (type === 'GOING') summary.going = row.count
      else if (type === 'MAYBE') summary.maybe = row.count
      else if (type === 'NOT_GOING') summary.notGoing = row.count
      else if (type === 'PENDING') summary.pending = row.count
    })

    summary.total = summary.going + summary.maybe + summary.notGoing + summary.pending

    return NextResponse.json({ rsvps, stats: summary })
  } catch (error: any) {
    console.error('Error fetching RSVP reports:', error)
    return NextResponse.json({ error: 'Failed to fetch RSVP reports' }, { status: 500 })
  }
}
