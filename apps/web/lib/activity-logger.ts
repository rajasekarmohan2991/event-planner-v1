import prisma from '@/lib/prisma'

export type ActivityAction =
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED'
  | 'EVENT_DELETED'
  | 'USER_REGISTERED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'REGISTRATION_CREATED'
  | 'REGISTRATION_CANCELLED'
  | 'PAYMENT_COMPLETED'
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'SPEAKER_CREATED'
  | 'SPONSOR_CREATED'
  | 'SESSION_CREATED'

export type EntityType = 
  | 'EVENT'
  | 'USER'
  | 'REGISTRATION'
  | 'PAYMENT'
  | 'TICKET'
  | 'SPEAKER'
  | 'SPONSOR'
  | 'SESSION'

interface LogActivityParams {
  userId?: bigint | string | null
  userName?: string
  userEmail?: string
  actionType: ActivityAction
  actionDescription: string
  entityType?: EntityType
  entityId?: bigint | string | null
  entityName?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an activity to the activity_log table
 */
export async function logActivity(params: LogActivityParams) {
  try {
    const {
      userId,
      userName,
      userEmail,
      actionType,
      actionDescription,
      entityType,
      entityId,
      entityName,
      metadata,
      ipAddress,
      userAgent
    } = params

    await prisma.$executeRaw`
      INSERT INTO activity_log (
        user_id,
        user_name,
        user_email,
        action_type,
        action_description,
        entity_type,
        entity_id,
        entity_name,
        metadata,
        ip_address,
        user_agent,
        created_at
      ) VALUES (
        ${userId ? BigInt(userId as any) : null},
        ${userName || null},
        ${userEmail || null},
        ${actionType},
        ${actionDescription},
        ${entityType || null},
        ${entityId ? BigInt(entityId as any) : null},
        ${entityName || null},
        ${metadata ? JSON.stringify(metadata) : null}::jsonb,
        ${ipAddress || null},
        ${userAgent || null},
        NOW()
      )
    `
  } catch (error) {
    console.error('Failed to log activity:', error)
    // Don't throw error - activity logging should not break the main flow
  }
}

/**
 * Get recent activities with pagination
 */
export async function getRecentActivities(limit: number = 50, offset: number = 0) {
  try {
    const activities = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id::text,
        user_id::text as "userId",
        user_name as "userName",
        user_email as "userEmail",
        action_type as "actionType",
        action_description as "actionDescription",
        entity_type as "entityType",
        entity_id::text as "entityId",
        entity_name as "entityName",
        metadata,
        ip_address as "ipAddress",
        user_agent as "userAgent",
        created_at as "createdAt"
      FROM activity_log
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, limit, offset)

    return activities
  } catch (error) {
    console.error('Failed to get recent activities:', error)
    return []
  }
}

/**
 * Get activity count
 */
export async function getActivityCount() {
  try {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*)::int as count
      FROM activity_log
    `)
    return result[0]?.count || 0
  } catch (error) {
    console.error('Failed to get activity count:', error)
    return 0
  }
}

/**
 * Get activities by user
 */
export async function getActivitiesByUser(userId: bigint | string, limit: number = 50) {
  try {
    const activities = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id::text,
        user_id::text as "userId",
        user_name as "userName",
        user_email as "userEmail",
        action_type as "actionType",
        action_description as "actionDescription",
        entity_type as "entityType",
        entity_id::text as "entityId",
        entity_name as "entityName",
        metadata,
        created_at as "createdAt"
      FROM activity_log
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, BigInt(userId as any), limit)

    return activities
  } catch (error) {
    console.error('Failed to get user activities:', error)
    return []
  }
}

/**
 * Get activities by entity
 */
export async function getActivitiesByEntity(
  entityType: EntityType,
  entityId: bigint | string,
  limit: number = 50
) {
  try {
    const activities = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id::text,
        user_id::text as "userId",
        user_name as "userName",
        user_email as "userEmail",
        action_type as "actionType",
        action_description as "actionDescription",
        entity_type as "entityType",
        entity_id::text as "entityId",
        entity_name as "entityName",
        metadata,
        created_at as "createdAt"
      FROM activity_log
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `, entityType, BigInt(entityId as any), limit)

    return activities
  } catch (error) {
    console.error('Failed to get entity activities:', error)
    return []
  }
}
