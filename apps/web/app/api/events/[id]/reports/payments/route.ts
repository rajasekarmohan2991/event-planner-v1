import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)

    const eventIdStr = params.id // Order table uses string eventId

    // Aggregate totals from "Order" table
    const [totals, byStatus, byMethod, revenueByDay] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(*)::int AS total, COALESCE(SUM("totalInr"),0)::bigint AS total_minor
         FROM "Order" WHERE "eventId" = $1`,
        eventIdStr
      ).catch(() => [{ total: 0, total_minor: 0 }]),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT "paymentStatus" as status, COUNT(*)::int AS count
         FROM "Order" WHERE "eventId" = $1
         GROUP BY "paymentStatus"`,
        eventIdStr
      ).catch(() => []),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT "paymentMethod" as payment_method, COUNT(*)::int AS count
         FROM "Order" WHERE "eventId" = $1
         GROUP BY "paymentMethod" ORDER BY count DESC NULLS LAST LIMIT 1`,
        eventIdStr
      ).catch(() => []),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
                COALESCE(SUM("totalInr"),0)::bigint AS amt
         FROM "Order" WHERE "eventId" = $1 AND "paymentStatus" IN ('COMPLETED','PAID','SUCCEEDED')
         GROUP BY day ORDER BY day DESC LIMIT 30`,
        eventIdStr
      ).catch(() => []),
    ])

    const totalPayments = totals[0]?.total || 0
    const totalRevenue = Number(totals[0]?.total_minor || 0) / 100
    const successfulPayments = (byStatus as any[]).find(s => (s.status || '').toUpperCase() === 'SUCCEEDED' || (s.status || '').toUpperCase() === 'COMPLETED' || (s.status || '').toUpperCase() === 'PAID')?.count || 0
    const failedPayments = (byStatus as any[]).find(s => (s.status || '').toUpperCase() === 'FAILED' || (s.status || '').toUpperCase() === 'ERROR' || (s.status || '').toUpperCase() === 'CANCELLED')?.count || 0
    const pendingPayments = (byStatus as any[]).find(s => (s.status || '').toUpperCase() === 'PENDING' || (s.status || '').toUpperCase() === 'CREATED')?.count || 0
    const averagePaymentAmount = totalPayments > 0 ? totalRevenue / totalPayments : 0
    const topPaymentMethod = byMethod[0]?.payment_method || 'N/A'
    const revenueByDayArr = (revenueByDay as any[]).map(r => ({ date: r.day, revenue: Number(r.amt) / 100 }))

    return NextResponse.json({
      totalPayments,
      totalRevenue,
      averagePaymentAmount,
      successfulPayments,
      failedPayments,
      pendingPayments,
      topPaymentMethod,
      refundRate: 0,
      revenueByDay: JSON.stringify(revenueByDayArr),
      paymentsByStatus: JSON.stringify(
        [
          { status: 'successful', count: successfulPayments },
          { status: 'failed', count: failedPayments },
          { status: 'pending', count: pendingPayments },
        ]
      )
    })
  } catch (error: any) {
    console.error('Error fetching payment analytics:', error)
    return NextResponse.json({ message: 'Failed to load payment analytics' }, { status: 500 })
  }
}
