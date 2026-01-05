import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

// List role assignments for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const items = await prisma.eventRoleAssignment.findMany({
    where: { eventId: params.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, eventId: true, userId: true, role: true, createdAt: true },
  }).catch(()=>[])
  
  // Manually fetch user details for each assignment
  const enriched = await Promise.all(items.map(async (item) => {
    const user = await prisma.user.findUnique({
      where: { id: item.userId },
      select: { email: true, name: true }
    }).catch(() => null)
    return { ...item, user }
  }))
  
  return NextResponse.json({ items: enriched })
}

// Add role assignment by userId or email
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const allowed = await requireEventRole(params.id, ['OWNER','ORGANIZER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json().catch(()=> ({}))
    const role = String(body.role || 'STAFF').toUpperCase() as any
    let userId: bigint | null = null
    if (body.userId) userId = BigInt(body.userId)
    else if (body.email) {
      const u = await prisma.user.findUnique({ where: { email: String(body.email).toLowerCase().trim() }, select: { id: true } })
      if (u) userId = u.id
    }
    if (!userId) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    const created = await prisma.eventRoleAssignment.create({ data: { eventId: params.id, userId, role } })
    return NextResponse.json(created, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to add role' }, { status: 500 })
  }
}
