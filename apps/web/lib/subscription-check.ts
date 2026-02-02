import prisma from '@/lib/prisma'

export interface SubscriptionLimits {
  canCreateEvent: boolean;
  canAddUser: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
}

/**
 * Check if tenant can create a new event based on subscription plan
 */
export async function canCreateEvent(tenantId: string): Promise<SubscriptionLimits> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  })

  if (!tenant) {
    return {
      canCreateEvent: false,
      reason: 'Tenant not found',
      currentCount: 0,
      maxAllowed: 0
    }
  }

  // Check if subscription is active
  if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
    return {
      canCreateEvent: false,
      reason: `Subscription is ${tenant.status}. Please activate your subscription to create events.`,
      currentCount: 0,
      maxAllowed: 0
    }
  }

  // Get current event count
  const eventCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count 
    FROM events 
    WHERE tenant_id = ${tenantId}
  `
  
  const currentEvents = Number(eventCount[0]?.count || 0)
  const maxEvents = tenant.maxEvents || 0

  if (currentEvents >= maxEvents) {
    return {
      canCreateEvent: false,
      reason: `Event limit reached (${currentEvents}/${maxEvents}). Please upgrade your plan.`,
      currentCount: currentEvents,
      maxAllowed: maxEvents
    }
  }

  return {
    canCreateEvent: true,
    currentCount: currentEvents,
    maxAllowed: maxEvents
  }
}

/**
 * Check if tenant can add a new user based on subscription plan
 */
export async function canAddUser(tenantId: string): Promise<SubscriptionLimits> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      _count: {
        select: { members: true }
      }
    }
  })

  if (!tenant) {
    return {
      canAddUser: false,
      reason: 'Tenant not found',
      currentCount: 0,
      maxAllowed: 0
    }
  }

  // Check if subscription is active
  if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
    return {
      canAddUser: false,
      reason: `Subscription is ${tenant.status}. Please activate your subscription.`,
      currentCount: 0,
      maxAllowed: 0
    }
  }

  const currentUsers = tenant._count.members
  const maxUsers = tenant.maxUsers || 0

  if (currentUsers >= maxUsers) {
    return {
      canAddUser: false,
      reason: `User limit reached (${currentUsers}/${maxUsers}). Please upgrade your plan.`,
      currentCount: currentUsers,
      maxAllowed: maxUsers
    }
  }

  return {
    canAddUser: true,
    currentCount: currentUsers,
    maxAllowed: maxUsers
  }
}

/**
 * Get subscription status and limits
 */
export async function getSubscriptionStatus(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      _count: {
        select: { members: true }
      }
    }
  })

  if (!tenant) {
    return null
  }

  // Get event count
  const eventCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count 
    FROM events 
    WHERE tenant_id = ${tenantId}
  `
  
  const currentEvents = Number(eventCount[0]?.count || 0)

  return {
    plan: tenant.plan,
    status: tenant.status,
    limits: {
      events: {
        current: currentEvents,
        max: tenant.maxEvents,
        percentage: (currentEvents / tenant.maxEvents) * 100
      },
      users: {
        current: tenant._count.members,
        max: tenant.maxUsers,
        percentage: (tenant._count.members / tenant.maxUsers) * 100
      },
      storage: {
        current: 0, // TODO: Calculate actual storage
        max: tenant.maxStorage,
        percentage: 0
      }
    },
    canCreateEvent: currentEvents < tenant.maxEvents && (tenant.status === 'ACTIVE' || tenant.status === 'TRIAL'),
    canAddUser: tenant._count.members < tenant.maxUsers && (tenant.status === 'ACTIVE' || tenant.status === 'TRIAL')
  }
}
