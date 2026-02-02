import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/super-admin/tenants - List all tenants
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    
    if (!session || (session as any).user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            members: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const formatted = tenants.map(t => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      subdomain: t.subdomain,
      status: t.status,
      plan: t.plan,
      memberCount: t._count.members,
      createdAt: t.createdAt,
      trialEndsAt: t.trialEndsAt
    }))

    return NextResponse.json({ tenants: formatted })
  } catch (error: any) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
  }
}
