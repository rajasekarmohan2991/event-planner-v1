import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

function toCsvRow(values: any[]) {
  return values.map(v => {
    if (v == null) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }).join(',')
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return new NextResponse('Forbidden', { status: 403 })

  const items = await (prisma as any).attendee.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, phone: true, ticketId: true, status: true, createdAt: true }
  }).catch(()=>[])

  const header = ['id','name','email','phone','ticketId','status','createdAt']
  const rows = [header.join(',')]
  for (const it of items) {
    rows.push(toCsvRow([it.id, it.name, it.email, it.phone, it.ticketId, it.status, it.createdAt?.toISOString?.() || '']))
  }
  const body = rows.join('\n') + '\n'
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="attendees-${eventId}.csv"`
    }
  })
}
