import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = session.user.id
    const userRole = session.user.role

    // Get user's current tenant
    const user = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { currentTenantId: true }
    })

    if (!user?.currentTenantId && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No tenant selected' }, { status: 400 })
    }

    // Get tenant subscription info
    const tenant = await prisma.tenant.findUnique({
      where: { id: user?.currentTenantId || 'default-tenant' },
      select: {
        plan: true,
        status: true,
        billingEmail: true,
        createdAt: true,
        _count: {
          select: { 
            members: true 
          }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Get event count
    const eventCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM events WHERE tenant_id = ${user?.currentTenantId}
    `

    // Calculate plan limits
    const planLimits = {
      FREE: { events: 10, users: 5, storage: 1 },
      STARTER: { events: 50, users: 20, storage: 10 },
      PRO: { events: 200, users: 100, storage: 50 },
      ENTERPRISE: { events: -1, users: -1, storage: -1 }
    }

    const currentLimits = planLimits[tenant.plan as keyof typeof planLimits] || planLimits.FREE

    const subscription = {
      plan: tenant.plan,
      status: tenant.status,
      maxEvents: currentLimits.events,
      maxUsers: currentLimits.users,
      maxStorage: currentLimits.storage,
      currentEvents: Number(eventCount[0]?.count || 0),
      currentUsers: tenant._count.members,
      currentStorage: 0.2, // Mock storage usage
      billingEmail: tenant.billingEmail,
      trialEndsAt: tenant.status === 'TRIAL' ? 
        new Date(new Date(tenant.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() : 
        null
    }

    return NextResponse.json({ success: true, subscription })
  } catch (error: any) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription', details: error.message },
      { status: 500 }
    )
  }
}
