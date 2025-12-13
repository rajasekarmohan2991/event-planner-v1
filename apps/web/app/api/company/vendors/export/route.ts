import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NS = 'vendors'

function toCsvValue(v: any): string {
  if (v === null || v === undefined) return ''
  const s = String(v).replace(/"/g, '""')
  if (s.search(/[",\n]/) >= 0) return `"${s}"`
  return s
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user?.currentTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = session.user.currentTenantId

    const base = process.env.INTERNAL_API_BASE_URL || 'http://localhost:8081'
    const url = `${base}/api/events?page=0&size=1000`
    const eventsRes = await fetch(url, { headers: { 'x-tenant-id': tenantId } })
    const eventsData = eventsRes.ok ? await eventsRes.json() : []
    const events = (eventsData.content || eventsData || [])

    const rows: string[] = []
    const headers = ['vendorId','eventId','eventName','name','category','status','costInr','contract','contractUrl','contactName','email','phone','notes','createdAt','updatedAt']
    rows.push(headers.join(','))

    for (const e of events) {
      const idStr = String(e.id)
      const key = `event:${idStr}`
      const kv = await prisma.keyValue.findFirst({ where: { namespace: NS, key }, select: { value: true } })
      const vendors = (kv?.value as any)?.vendors || []
      for (const v of vendors) {
        const r = [
          toCsvValue(v.id),
          toCsvValue(idStr),
          toCsvValue(e.name || ''),
          toCsvValue(v.name),
          toCsvValue(v.category),
          toCsvValue(v.status),
          toCsvValue(v.costInr),
          toCsvValue(v.contract),
          toCsvValue(v.contractUrl || ''),
          toCsvValue(v.contactName || ''),
          toCsvValue(v.email || ''),
          toCsvValue(v.phone || ''),
          toCsvValue(v.notes || ''),
          toCsvValue(v.createdAt),
          toCsvValue(v.updatedAt),
        ]
        rows.push(r.join(','))
      }
    }

    const csv = rows.join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="vendors_all_events.csv"',
        'Cache-Control': 'no-store'
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to export vendors' }, { status: 500 })
  }
}
