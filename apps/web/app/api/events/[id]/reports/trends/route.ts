import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session || !(session as any)?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const eventId = params.id
  const { searchParams } = new URL(req.url)
  const granularity = searchParams.get('granularity') || 'daily'
  const days = granularity === 'weekly' ? 84 : 30 // 12 weeks or 30 days

  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get registrations trend
    const registrationTrend = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${granularity === 'weekly' ? 'week' : 'day'}, "createdAt") as period,
        COUNT(*)::int as count
      FROM "Registration"
      WHERE "eventId" = ${eventId} 
        AND "createdAt" >= ${startDate}
      GROUP BY period
      ORDER BY period ASC
    ` as Array<{ period: Date; count: number }>

    // Get orders trend
    const orderTrend = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${granularity === 'weekly' ? 'week' : 'day'}, "createdAt") as period,
        COUNT(*)::int as count,
        SUM("totalInr")::int as revenue
      FROM "Order"
      WHERE "eventId" = ${eventId} 
        AND "createdAt" >= ${startDate}
      GROUP BY period
      ORDER BY period ASC
    ` as Array<{ period: Date; count: number; revenue: number }>

    return NextResponse.json({
      registrations: registrationTrend.map(item => ({
        date: item.period.toISOString().split('T')[0],
        count: item.count
      })),
      orders: orderTrend.map(item => ({
        date: item.period.toISOString().split('T')[0],
        count: item.count,
        revenue: item.revenue || 0
      }))
    })
  } catch (error) {
    console.error('Trends error:', error)
    // Return empty data structure instead of error for better UX
    return NextResponse.json({
      registrations: [],
      orders: []
    })
  }
}
