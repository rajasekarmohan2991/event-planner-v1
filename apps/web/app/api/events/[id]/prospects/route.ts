import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'

// Prospects (MVP): RSVPs likely to convert but not yet registered
// - RSVP status in (PENDING, MAYBE)
// - No completed registration for same email
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()

    const rsvps = await (prisma as any).rSVP.findMany({
      where: {
        eventId,
        status: { in: ['PENDING','MAYBE'] },
        ...(q ? { email: { contains: q, mode: 'insensitive' } } : {}),
      },
      select: { id: true, email: true, name: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }).catch(() => [])

    const regEmails = new Set<string>(
      (
        await (prisma as any).registration.findMany({ where: { eventId }, select: { email: true } }).catch(() => [])
      ).map((r: any) => (r.email || '').trim()).filter(Boolean)
    )

    const prospects = rsvps.filter((r: any) => r.email && !regEmails.has((r.email || '').trim()))

    return NextResponse.json({ items: prospects })
  } catch (e: any) {
    return NextResponse.json({ items: [] }, { status: 200 })
  }
}
