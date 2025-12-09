import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireEventRole } from '@/lib/rbac'

const NS_REFUNDS = 'order_refunds'

export async function POST(req: NextRequest, { params }: { params: { id: string; orderId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { id: eventId, orderId } = params
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const { reason } = await req.json().catch(()=> ({}))
    // Try to update order if model exists; otherwise fallback to KV stub
    let updated: any = null
    try {
      updated = await (prisma as any).order.update({
        where: { id: String(orderId) },
        data: { paymentStatus: 'REFUND_REQUESTED', refundReason: reason || null },
        select: { id: true, paymentStatus: true },
      })
    } catch {
      const kv = await prisma.keyValue.upsert({
        where: { namespace_key: { namespace: NS_REFUNDS, key: `${eventId}:${orderId}` } },
        create: { namespace: NS_REFUNDS, key: `${eventId}:${orderId}`, value: { status: 'REFUND_REQUESTED', reason: reason || null, at: new Date().toISOString() } },
        update: { value: { status: 'REFUND_REQUESTED', reason: reason || null, at: new Date().toISOString() } },
        select: { value: true },
      })
      updated = { id: orderId, paymentStatus: (kv.value as any)?.status || 'REFUND_REQUESTED' }
    }
    return NextResponse.json({ success: true, order: updated })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Refund failed' }, { status: 500 })
  }
}
