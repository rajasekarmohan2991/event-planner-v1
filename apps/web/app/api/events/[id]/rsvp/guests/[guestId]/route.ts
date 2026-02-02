import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string; guestId: string } }) {
  const { id: eventId, guestId } = params
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json().catch(() => ({}))
    const { name, email, company, phone, notes, status } = body || {}
    const updated = await prisma.rsvpGuest.update({
      where: { id: String(guestId) },
      data: { name, email, company, phone, notes, status },
      select: { id: true, name: true, email: true, company: true, phone: true, status: true, createdAt: true },
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to update guest' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; guestId: string } }) {
  const { id: eventId, guestId } = params
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    await prisma.rsvpGuest.update({ where: { id: String(guestId) }, data: { deletedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to delete guest' }, { status: 500 })
  }
}
