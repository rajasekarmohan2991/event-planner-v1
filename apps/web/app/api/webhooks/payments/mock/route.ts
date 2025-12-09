import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const NS = 'payment_webhook_logs'

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text()
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    await prisma.keyValue.create({
      data: { namespace: NS, key: id, value: { headers: Object.fromEntries(req.headers), body: bodyText } }
    }).catch(()=>{})
    // Simulate order status update if payload has orderId
    try {
      const json = JSON.parse(bodyText || '{}')
      const orderId = json.orderId || json.data?.orderId
      const status = json.status || json.data?.status
      if (orderId && status) {
        await (prisma as any).order.update({ where: { id: String(orderId) }, data: { paymentStatus: String(status) } }).catch(()=>{})
      }
    } catch {}
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'failed' }, { status: 500 })
  }
}
