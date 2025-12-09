import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session || !(session as any)?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const eventId = params.id

  try {
    const [
      totalRegistrations,
      totalOrders,
      totalRevenue,
      checkedInCount,
      rsvpStats,
      exhibitorCount,
      boothCount
    ] = await Promise.all([
      prisma.registration.count({ where: { eventId } }).catch(() => 0),
      (prisma as any).order?.count?.({ where: { eventId } }).catch(() => 0),
      (prisma as any).order?.aggregate?.({
        where: { eventId, status: 'PAID' },
        _sum: { totalInr: true }
      }).catch(() => ({ _sum: { totalInr: 0 } })),
      prisma.registration.count({ 
        where: { eventId, status: 'APPROVED' } 
      }).catch(() => 0),
      prisma.rSVP.groupBy({
        by: ['status'],
        where: { eventId },
        _count: { id: true }
      }).catch(() => [] as Array<{ status: string; _count: { id: number } }>),
      prisma.exhibitor.count({ where: { eventId } }).catch(() => 0),
      prisma.booth.count({ where: { eventId } }).catch(() => 0)
    ])

    const rsvpCounts = rsvpStats.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      registrations: {
        total: totalRegistrations,
        checkedIn: checkedInCount,
        pending: totalRegistrations - checkedInCount
      },
      orders: {
        total: totalOrders,
        revenue: totalRevenue._sum.totalInr || 0
      },
      rsvp: {
        going: rsvpCounts.GOING || 0,
        interested: rsvpCounts.INTERESTED || 0,
        notGoing: rsvpCounts.NOT_GOING || 0
      },
      exhibitors: {
        total: exhibitorCount,
        booths: boothCount
      }
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ message: 'Failed to fetch stats' }, { status: 500 })
  }
}
