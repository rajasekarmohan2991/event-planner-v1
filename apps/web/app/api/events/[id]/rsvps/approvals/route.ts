import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

// List pending RSVPs (we treat waitlisted=true as pending approval)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const pending = await (prisma as any).rSVP.findMany({
    where: { eventId, waitlisted: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, userId: true, status: true, createdAt: true },
  })
  return NextResponse.json({ items: pending })
}

// Approve or deny RSVP
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const { rsvpId, action } = await req.json()
  if (!rsvpId || !['approve','deny'].includes(action)) {
    return NextResponse.json({ message: 'rsvpId and action approve|deny required' }, { status: 400 })
  }

  const rsvp = await (prisma as any).rSVP.findUnique({ where: { id: String(rsvpId) } })
  if (!rsvp || rsvp.eventId !== eventId) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const updateData: any = { waitlisted: false }
  if (action === 'approve') updateData.status = 'GOING'
  if (action === 'deny') updateData.status = 'NOT_GOING'

  const updated = await (prisma as any).rSVP.update({ where: { id: rsvp.id }, data: updateData })
  return NextResponse.json({ success: true, rsvp: updated })
}
