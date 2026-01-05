import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

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

  const regs = await prisma.registration.findMany({
    where: { eventId, createdAt: { gte: since } },
    select: { createdAt: true },
  }).catch(()=>[] as { createdAt: Date }[])

  const map = new Map<string, number>()
  for (let i=0;i<days;i++) { map.set(fmtDay(new Date(Date.now()-i*86400000)), 0) }
  for (const r of regs) {
    const key = fmtDay(new Date(r.createdAt))
    map.set(key, (map.get(key)||0)+1)
  }

  const series = Array.from(map.entries()).sort(([a],[b])=> a.localeCompare(b)).map(([date,count])=>({ date, count }))
  return NextResponse.json({ items: series })
}
