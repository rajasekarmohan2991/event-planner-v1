import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  // Best-effort queries; adapt to available schema
  const [regTotal, regConfirmed, regPaid, regCheckedIn, ordersPaid, revenue] = await Promise.all([
    prisma.registration?.count?.({ where: { eventId } }).catch(()=>0),
    prisma.registration?.count?.({ where: { eventId, status: 'CONFIRMED' as any } }).catch(()=>0),
    prisma.registration?.count?.({ where: { eventId, status: 'PAID' as any } }).catch(()=>0),
    prisma.registration?.count?.({ where: { eventId, status: 'CHECKED_IN' as any } }).catch(()=>0),
    (prisma as any).order?.count?.({ where: { eventId, paymentStatus: 'PAID' } }).catch(()=>0),
    (async()=>{
      try {
        const items = await (prisma as any).order.findMany({ where: { eventId, paymentStatus: 'PAID' }, select: { totalInr: true } })
        return items.reduce((s: number, it: any) => s + (Number(it?.totalInr)||0), 0)
      } catch { return 0 }
    })(),
  ])

  return NextResponse.json({
    registrations: { total: regTotal, confirmed: regConfirmed, paid: regPaid },
    checkIns: { total: regCheckedIn },
    orders: { paid: ordersPaid, revenueInr: revenue },
  })
}
