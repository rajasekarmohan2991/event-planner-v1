import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

const NS_AUDIT = 'audit_log'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  try {
    const item = await prisma.keyValue.findUnique({
      where: { namespace_key: { namespace: NS_AUDIT, key: eventId } },
      select: { value: true },
    })
    const entries = Array.isArray((item?.value as any)?.entries) ? (item?.value as any).entries : []
    return NextResponse.json({ items: entries.slice(-50).reverse() })
  } catch (e:any) {
    return NextResponse.json({ items: [] })
  }
}
