import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions, checkUserRole } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !checkUserRole(session, ['ADMIN', 'ORGANIZER', 'STAFF'])) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const eventId = parseInt(params.id)

  try {
    // Use raw SQL queries to avoid Prisma type issues
    const [
      totalRegistrations,
      checkedInCount,
      pendingCount,
      approvedCount
    ] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId}`,
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId} AND (data_json->>'checkedIn')::boolean = true`,
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId} AND (data_json->>'status') = 'PENDING'`,
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId} AND (data_json->>'status') = 'APPROVED'`
    ])

    const total = (totalRegistrations as any)[0]?.count || 0
    const checkedIn = (checkedInCount as any)[0]?.count || 0
    const pending = (pendingCount as any)[0]?.count || 0
    const approved = (approvedCount as any)[0]?.count || 0

    return NextResponse.json({
      total: total,
      checkedIn: checkedIn,
      pending: pending,
      approved: approved,
      remaining: total - checkedIn,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Live stats error:', error)
    return NextResponse.json({ message: 'Failed to fetch live stats' }, { status: 500 })
  }
}
