import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (session as any).user?.role
  const userId = BigInt((session as any).user.id)

  // Super Admin can see ALL companies
  if (userRole === 'SUPER_ADMIN') {
    const allTenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({
      tenants: allTenants.map(t => ({
        ...t,
        memberRole: 'SUPER_ADMIN'
      }))
    })
  }

  // Regular users only see companies they are members of
  const memberships = await prisma.tenantMember.findMany({
    where: { userId, status: 'ACTIVE' },
    include: { tenant: true }
  })

  return NextResponse.json({
    tenants: memberships.map(m => ({
      ...m.tenant,
      memberRole: m.role
    }))
  })
}
