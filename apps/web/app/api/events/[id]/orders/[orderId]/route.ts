import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string, orderId: string } }) {
  const eventId = params.id
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const order = await (prisma as any).order.findUnique({
      where: { id: String(params.orderId) },
      select: {
        id: true,
        eventId: true,
        buyerEmail: true,
        buyerName: true,
        totalInr: true,
        paymentStatus: true,
        paymentRef: true,
        createdAt: true,
        updatedAt: true,
        items: { select: { id: true, ticketId: true, name: true, qty: true, priceInr: true } },
      },
    })
    if (!order || order.eventId !== eventId) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    return NextResponse.json(order)
  } catch (e: any) {
    return NextResponse.json({ message: 'Failed to load' }, { status: 500 })
  }
}
