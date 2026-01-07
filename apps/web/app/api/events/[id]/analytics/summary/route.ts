import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = BigInt(params.id)
  const allowed = await requireEventRole(params.id, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    // Use raw SQL queries for registrations table
    const [regTotalResult, regCheckedInResult, ordersPaidResult, revenueResult] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId}`.catch(()=>[{count:0}]),
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId} AND check_in_status = 'CHECKED_IN'`.catch(()=>[{count:0}]),
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Order" WHERE "eventId" = ${params.id} AND "paymentStatus" = 'COMPLETED'`.catch(()=>[{count:0}]),
      prisma.$queryRaw`SELECT COALESCE(SUM("totalInr"), 0)::numeric as total FROM "Order" WHERE "eventId" = ${params.id} AND "paymentStatus" = 'COMPLETED'`.catch(()=>[{total:0}]),
    ]) as any[]

    const regTotal = (regTotalResult[0]?.count || 0)
    const regCheckedIn = (regCheckedInResult[0]?.count || 0)
    const ordersPaid = (ordersPaidResult[0]?.count || 0)
    const revenue = Number(revenueResult[0]?.total || 0)

    return NextResponse.json({
      registrations: { total: regTotal, confirmed: regTotal, paid: regTotal },
      checkIns: { total: regCheckedIn },
      orders: { paid: ordersPaid, revenueInr: revenue },
    })
  } catch (error) {
    console.error('Analytics summary error:', error)
    return NextResponse.json({
      registrations: { total: 0, confirmed: 0, paid: 0 },
      checkIns: { total: 0 },
      orders: { paid: 0, revenueInr: 0 },
    })
  }
}
