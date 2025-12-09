import { prisma } from '@/lib/prisma'

export interface ActivityLog {
  userId?: bigint | number
  userName?: string
  userEmail?: string
  action: string
  entityType: string
  entityId?: string
  entityName?: string
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  tenantId?: string
}

/**
 * Log an activity to the database
 * This is fire-and-forget - errors are logged but don't block the main operation
 */
export async function logActivity(data: ActivityLog): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        userId: data.userId ? BigInt(data.userId) : null,
        userName: data.userName,
        userEmail: data.userEmail,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        description: data.description,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        tenantId: data.tenantId,
      },
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw - activity logging should never break the main flow
  }
}

/**
 * Get recent activities
 */
export async function getRecentActivities(limit: number = 20, tenantId?: string) {
  try {
    const where: any = {}
    if (tenantId) {
      where.tenantId = tenantId
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return activities.map(activity => ({
      ...activity,
      userId: activity.userId ? activity.userId.toString() : null,
    }))
  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return []
  }
}

/**
 * Get activities for a specific entity
 */
export async function getEntityActivities(entityType: string, entityId: string, limit: number = 50) {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return activities.map(activity => ({
      ...activity,
      userId: activity.userId ? activity.userId.toString() : null,
    }))
  } catch (error) {
    console.error('Failed to fetch entity activities:', error)
    return []
  }
}

/**
 * Get activities for a specific user
 */
export async function getUserActivities(userId: bigint | number, limit: number = 50) {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        userId: BigInt(userId),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return activities.map(activity => ({
      ...activity,
      userId: activity.userId ? activity.userId.toString() : null,
    }))
  } catch (error) {
    console.error('Failed to fetch user activities:', error)
    return []
  }
}

// Activity action constants
export const ActivityActions = {
  // Events
  EVENT_CREATED: 'EVENT_CREATED',
  EVENT_UPDATED: 'EVENT_UPDATED',
  EVENT_DELETED: 'EVENT_DELETED',
  EVENT_PUBLISHED: 'EVENT_PUBLISHED',
  
  // Registrations
  REGISTRATION_CREATED: 'REGISTRATION_CREATED',
  REGISTRATION_APPROVED: 'REGISTRATION_APPROVED',
  REGISTRATION_REJECTED: 'REGISTRATION_REJECTED',
  REGISTRATION_CANCELLED: 'REGISTRATION_CANCELLED',
  
  // Users
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  
  // Tickets
  TICKET_CREATED: 'TICKET_CREATED',
  TICKET_PURCHASED: 'TICKET_PURCHASED',
  TICKET_REFUNDED: 'TICKET_REFUNDED',
  
  // Sessions
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_UPDATED: 'SESSION_UPDATED',
  SESSION_DELETED: 'SESSION_DELETED',
  
  // Speakers
  SPEAKER_CREATED: 'SPEAKER_CREATED',
  SPEAKER_UPDATED: 'SPEAKER_UPDATED',
  SPEAKER_DELETED: 'SPEAKER_DELETED',
  
  // Sponsors
  SPONSOR_CREATED: 'SPONSOR_CREATED',
  SPONSOR_UPDATED: 'SPONSOR_UPDATED',
  SPONSOR_DELETED: 'SPONSOR_DELETED',
  
  // Exhibitors
  EXHIBITOR_CREATED: 'EXHIBITOR_CREATED',
  EXHIBITOR_UPDATED: 'EXHIBITOR_UPDATED',
  EXHIBITOR_DELETED: 'EXHIBITOR_DELETED',
} as const

export const EntityTypes = {
  EVENT: 'EVENT',
  REGISTRATION: 'REGISTRATION',
  USER: 'USER',
  TICKET: 'TICKET',
  SESSION: 'SESSION',
  SPEAKER: 'SPEAKER',
  SPONSOR: 'SPONSOR',
  EXHIBITOR: 'EXHIBITOR',
} as const
