import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'

function fmtDay(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth()+1).padStart(2,'0')
  const dd = String(d.getUTCDate()).padStart(2,'0')
  return `${y}-${m}-${dd}`
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const days = Math.max(1, Math.min(180, Number(url.searchParams.get('days')||30)))
  const since = new Date(Date.now() - days*24*60*60*1000)

  let orders: Array<{ createdAt: Date, totalInr?: number|null, paymentStatus?: string|null }> = []
  try {
    orders = await (prisma as any).order.findMany({
      where: { eventId, createdAt: { gte: since }, paymentStatus: 'PAID' },
      select: { createdAt: true, totalInr: true, paymentStatus: true },
    })
  } catch {}

  const map = new Map<string, number>()
  for (let i=0;i<days;i++) { map.set(fmtDay(new Date(Date.now()-i*86400000)), 0) }
  for (const o of orders) {
    const key = fmtDay(new Date(o.createdAt))
    const amt = Number(o.totalInr||0)
    map.set(key, (map.get(key)||0)+amt)
  }

  const series = Array.from(map.entries()).sort(([a],[b])=> a.localeCompare(b)).map(([date,amountInr])=>({ date, amountInr }))
  return NextResponse.json({ items: series })
}
