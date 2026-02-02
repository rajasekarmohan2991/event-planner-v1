import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Counts using Prisma models (tenant isolation middleware applies automatically)
    const [totalEvents, upcomingEvents, activeLive, activeUpcoming, totalRegistrations, revenueAgg] = await Promise.all([
      prisma.event.count({}),
      prisma.event.count({ where: { startsAt: { gt: now }, NOT: { status: { in: ['TRASHED', 'CANCELLED'] as any } } } as any }),
      prisma.event.count({ where: { status: 'LIVE' } as any }),
      prisma.event.count({ where: { status: 'UPCOMING' } as any }),
      prisma.registration.count({}),
      prisma.order.aggregate({ _sum: { totalInr: true }, where: { paymentStatus: 'PAID' } as any })
    ])

    const totalRevenue = Number(revenueAgg._sum.totalInr || 0)
    const activeEvents = activeLive + activeUpcoming

    const payload = {
      totalEvents,
      activeEvents,
      totalRegistrations,
      upcomingEvents,
      totalRevenue,
      attendanceRate: 0
    }

    return NextResponse.json(payload)
  } catch (e: any) {
    console.error('dashboard stats error:', e)
    return NextResponse.json({ message: 'Failed to load stats' }, { status: 500 })
  }
}
