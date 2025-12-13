import { NextRequest, NextResponse } from 'next/server'
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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const key = `event:${params.id}`
    const kv = await prisma.keyValue.findFirst({ where: { namespace: NS, key }, select: { value: true } })
    const vendors = (kv?.value as any)?.vendors || []

    const headers = ['vendorId','eventId','name','category','status','costInr','contract','contractUrl','contactName','email','phone','notes','createdAt','updatedAt']
    const rows = [headers.join(',')]
    for (const v of vendors) {
      const r = [
        toCsvValue(v.id),
        toCsvValue(v.eventId),
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

    const csv = rows.join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vendors_${params.id}.csv"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to export vendors' }, { status: 500 })
  }
}
