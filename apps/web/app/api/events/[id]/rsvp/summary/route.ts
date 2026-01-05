import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const [all, going, interested, notGoing, ytr] = await Promise.all([
      prisma.rsvpGuest.count({ where: { eventId, deletedAt: null } }),
      prisma.rsvpGuest.count({ where: { eventId, status: 'GOING', deletedAt: null } }),
      prisma.rsvpGuest.count({ where: { eventId, status: 'INTERESTED', deletedAt: null } }),
      prisma.rsvpGuest.count({ where: { eventId, status: 'NOT_GOING', deletedAt: null } }),
      prisma.rsvpGuest.count({ where: { eventId, status: 'YET_TO_RESPOND', deletedAt: null } }),
    ])
    return NextResponse.json({ all, going, interested, notGoing, yetToRespond: ytr })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to load summary' }, { status: 500 })
  }
}
