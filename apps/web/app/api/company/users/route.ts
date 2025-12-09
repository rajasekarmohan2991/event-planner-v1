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
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let currentTenantId = (session.user as any).currentTenantId as string | undefined
    
    // If no currentTenantId, try to get it from tenant_members table
    if (!currentTenantId) {
      const userId = BigInt((session.user as any).id)
      const memberRecord = await prisma.tenantMember.findFirst({
        where: { userId: userId },
        select: { tenantId: true }
      })
      currentTenantId = memberRecord?.tenantId
    }
    
    if (!currentTenantId) {
      return NextResponse.json({ error: 'No tenant found for user', users: [] }, { status: 200 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseIntSafe(searchParams.get('page'), 1)
    const limit = Math.min(parseIntSafe(searchParams.get('limit'), 50), 200)
    const q = (searchParams.get('q') || '').trim()

    const offset = (page - 1) * limit

    const like = q ? `%${q}%` : null

    // 1. Fetch registered users
    const registeredUsers = await prisma.$queryRaw<any[]>`
      SELECT 
        u.id::text as id,
        u.name,
        u.email,
        u.role,
        tm.role as "tenantRole"
      FROM users u
      INNER JOIN tenant_members tm ON u.id = tm."userId"
      WHERE tm."tenantId" = ${currentTenantId}
        ${like ? prisma.$queryRaw`AND (u.name ILIKE ${like} OR u.email ILIKE ${like})` : prisma.$queryRaw``}
      ORDER BY u.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    // 2. Fetch approved invites (who haven't registered yet)
    // We fetch slightly more to account for potential duplicates with registered users (though unlikely if logic holds)
    const approvedInvites = await prisma.teamInvite.findMany({
      where: {
        tenantId: currentTenantId,
        status: 'APPROVED',
        OR: q ? [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ] : undefined
      },
      take: limit,
      orderBy: { name: 'asc' }
    })

    // 3. Merge lists
    // Filter out invites if email already exists in registeredUsers
    const registeredEmails = new Set(registeredUsers.map(u => u.email.toLowerCase()))
    
    const inviteUsers = approvedInvites
      .filter(inv => !registeredEmails.has(inv.email.toLowerCase()))
      .map(inv => ({
        id: -1, // Placeholder ID for non-registered users
        name: inv.name,
        email: inv.email,
        role: 'USER', // Default system role
        tenantRole: inv.role,
        isInvite: true
      }))

    const allUsers = [...registeredUsers, ...inviteUsers]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, limit) // Enforce limit on merged result

    // Recalculate total (approximate)
    let total = 0
    const totalRows = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count
      FROM users u
      INNER JOIN tenant_members tm ON u.id = tm."userId"
      WHERE tm."tenantId" = ${currentTenantId}
        ${like ? prisma.$queryRaw`AND (u.name ILIKE ${like} OR u.email ILIKE ${like})` : prisma.$queryRaw``}
    `
    const totalInvites = await prisma.teamInvite.count({
      where: {
        tenantId: currentTenantId,
        status: 'APPROVED',
        OR: q ? [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ] : undefined
      }
    })
    
    total = ((totalRows as any)[0]?.count || 0) + totalInvites

    return NextResponse.json({
      page,
      limit,
      total,
      users: allUsers.map(u => ({
        id: parseInt(u.id) || -1,
        name: u.name,
        email: u.email,
        role: u.role,
        tenantRole: u.tenantRole,
        isInvite: u.isInvite
      }))
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load users' }, { status: 500 })
  }
}
