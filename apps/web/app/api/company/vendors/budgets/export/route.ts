import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const VNS = 'vendors'
const BNS = 'vendor_budgets'

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
    const headers = ['eventId','eventName','category','budget','spent','remaining']
    rows.push(headers.join(','))

    for (const e of events) {
      const idStr = String(e.id)
      const key = `event:${idStr}`
      const [vendorsKV, budgetsKV] = await Promise.all([
        prisma.keyValue.findFirst({ where: { namespace: VNS, key }, select: { value: true } }),
        prisma.keyValue.findFirst({ where: { namespace: BNS, key }, select: { value: true } }),
      ])
      const vendors: any[] = (vendorsKV?.value as any)?.vendors || []
      const budgets: Record<string, number> = (budgetsKV?.value as any) || {}

      const spent: Record<string, number> = {}
      for (const v of vendors) {
        const cat = v.category || 'Other'
        spent[cat] = (spent[cat] || 0) + Number(v.costInr || 0)
      }

      const categories = Array.from(new Set([...Object.keys(budgets), ...Object.keys(spent)]))
      for (const cat of categories) {
        const b = Number(budgets[cat] || 0)
        const s = Number(spent[cat] || 0)
        const r = b - s
        rows.push([
          toCsvValue(idStr),
          toCsvValue(e.name || ''),
          toCsvValue(cat),
          toCsvValue(b),
          toCsvValue(s),
          toCsvValue(r)
        ].join(','))
      }
    }

    const csv = rows.join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="budgets_all_events.csv"',
        'Cache-Control': 'no-store'
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to export budgets' }, { status: 500 })
  }
}
