
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function parseIntSafe(v: string | null, d: number) {
  const n = v ? parseInt(v, 10) : NaN
  return Number.isFinite(n) && n > 0 ? n : d
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let currentTenantId = session.user.currentTenantId

    // If no currentTenantId, try to get the first tenant they are a member of
    if (!currentTenantId) {
      const userId = BigInt(session.user.id)
      const memberRecord = await prisma.tenantMember.findFirst({
        where: { userId: userId },
        select: { tenantId: true }
      })
      currentTenantId = memberRecord?.tenantId
    }

    // If still no tenant, return empty list (user might be a lone wolf or new)
    if (!currentTenantId) {
      return NextResponse.json({ users: [], total: 0, page: 1, limit: 50 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseIntSafe(searchParams.get('page'), 1)
    const limit = Math.min(parseIntSafe(searchParams.get('limit'), 50), 200)
    const q = (searchParams.get('q') || '').trim()

    const offset = (page - 1) * limit

    // Standard Prisma Query for Users in Tenant
    // assuming TenantMember links User and Tenant
    const whereClause: any = {
      memberships: {
        some: {
          tenantId: currentTenantId
        }
      }
    }

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true, // System role
          memberships: {
            where: { tenantId: currentTenantId },
            select: { role: true }
          }
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset
      }),
      prisma.user.count({ where: whereClause })
    ])

    // Normalize output
    const mappedUsers = users.map(u => ({
      id: String(u.id),
      name: u.name,
      email: u.email,
      role: u.role,
      tenantRole: u.memberships[0]?.role || 'MEMBER',
      isInvite: false
    }))

    return NextResponse.json({
      page,
      limit,
      total,
      users: mappedUsers
    })
  } catch (e: any) {
    console.error('Error in company/users:', e)
    return NextResponse.json({ error: e?.message || 'Failed to load users' }, { status: 500 })
  }
}
