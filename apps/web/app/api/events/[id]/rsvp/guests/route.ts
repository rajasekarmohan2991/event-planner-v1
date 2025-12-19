import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const isSuperAdmin = (session as any)?.user?.role === 'SUPER_ADMIN'
  const allowed = isSuperAdmin ? true : await requireEventRole(eventId, ['STAFF', 'ORGANIZER', 'OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const query = (searchParams.get('query') || '').trim()
  const status = searchParams.get('status') || ''
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '20')))
  const where: any = { eventId, deletedAt: null }
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { email: { contains: query, mode: 'insensitive' } },
      { company: { contains: query, mode: 'insensitive' } },
    ]
  }
  if (status) where.status = status

  try {
    const [total, items] = await Promise.all([
      prisma.rsvpGuest.count({ where }).catch(() => 0),
      prisma.rsvpGuest.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, name: true, email: true, company: true, phone: true, status: true, createdAt: true },
      }).catch((err) => {
        console.error('❌ Failed to fetch RSVP guests:', err)
        return []
      })
    ])

    console.log('📊 RSVP guests fetched:', { total, itemsCount: items.length, eventId })
    return NextResponse.json({ total, page, pageSize, items })
  } catch (e: any) {
    console.error('❌ RSVP guests API error:', e)
    return NextResponse.json({
      message: e?.message || 'Failed to load guests',
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const isSuperAdmin = (session as any)?.user?.role === 'SUPER_ADMIN'
  const allowed = isSuperAdmin ? true : await requireEventRole(eventId, ['STAFF', 'ORGANIZER', 'OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const { name, email, company, phone, notes, status } = body || {}
  if (!email) return NextResponse.json({ message: 'email required' }, { status: 400 })
  try {
    const created = await prisma.rsvpGuest.create({
      data: { eventId, name, email, company, phone, notes, status: status || 'YET_TO_RESPOND' },
      select: { id: true, name: true, email: true, company: true, phone: true, status: true, createdAt: true },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to add guest' }, { status: 500 })
  }
}
