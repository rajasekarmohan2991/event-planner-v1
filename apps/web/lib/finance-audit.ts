import prisma from '@/lib/prisma';

export type FinanceAuditAction = 
    | 'INVOICE_CREATED'
    | 'INVOICE_UPDATED'
    | 'INVOICE_SENT'
    | 'INVOICE_PAID'
    | 'INVOICE_CANCELLED'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_FAILED'
    | 'PAYOUT_INITIATED'
    | 'PAYOUT_COMPLETED'
    | 'PAYOUT_FAILED'
    | 'TDS_DEDUCTED'
    | 'TDS_DEPOSITED'
    | 'REFUND_REQUESTED'
    | 'REFUND_APPROVED'
    | 'REFUND_REJECTED'
    | 'REFUND_PROCESSED'
    | 'CHARGE_APPLIED'
    | 'CREDIT_APPLIED'
    | 'CONSENT_RECORDED'
    | 'SETTINGS_UPDATED';

export type FinanceEntityType = 
    | 'INVOICE'
    | 'PAYMENT'
    | 'PAYOUT'
    | 'REFUND'
    | 'TDS'
    | 'CHARGE'
    | 'CREDIT'
    | 'CONSENT'
    | 'SETTINGS';

export interface AuditLogParams {
    tenantId: string;
    eventId?: bigint | number | string | null;
    actionType: FinanceAuditAction;
    actionDescription?: string;
    entityType: FinanceEntityType;
    entityId: string;
    previousState?: Record<string, any> | null;
    newState?: Record<string, any> | null;
    amount?: number;
    currency?: string;
    performedByUserId?: bigint | number | string | null;
    performedByName?: string;
    performedByEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    externalReference?: string;
    webhookEventId?: string;
}

/**
 * Log a finance-related action for audit trail
 */
export async function logFinanceAudit(params: AuditLogParams): Promise<string | null> {
    try {
        const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await prisma.$executeRawUnsafe(`
            INSERT INTO finance_audit_logs (
                id, tenant_id, event_id,
                action_type, action_description,
                entity_type, entity_id,
                previous_state, new_state,
                amount, currency,
                performed_by_user_id, performed_by_name, performed_by_email,
                ip_address, user_agent, request_id,
                external_reference, webhook_event_id,
                created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW()
            )
        `,
            id,
            params.tenantId,
            params.eventId ? BigInt(params.eventId.toString()) : null,
            params.actionType,
            params.actionDescription || null,
            params.entityType,
            params.entityId,
            params.previousState ? JSON.stringify(params.previousState) : null,
            params.newState ? JSON.stringify(params.newState) : null,
            params.amount || null,
            params.currency || null,
            params.performedByUserId ? BigInt(params.performedByUserId.toString()) : null,
            params.performedByName || null,
            params.performedByEmail || null,
            params.ipAddress || null,
            params.userAgent || null,
            params.requestId || null,
            params.externalReference || null,
            params.webhookEventId || null
        );

        return id;
    } catch (error) {
        console.error('Failed to log finance audit:', error);
        // Don't throw - audit logging should not break the main operation
        return null;
    }
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogsForEntity(
    entityType: FinanceEntityType,
    entityId: string,
    limit: number = 50
): Promise<any[]> {
    try {
        const logs = await prisma.$queryRawUnsafe(`
            SELECT 
                id,
                tenant_id as "tenantId",
                event_id as "eventId",
                action_type as "actionType",
                action_description as "actionDescription",
                entity_type as "entityType",
                entity_id as "entityId",
                previous_state as "previousState",
                new_state as "newState",
                amount,
                currency,
                performed_by_user_id as "performedByUserId",
                performed_by_name as "performedByName",
                performed_by_email as "performedByEmail",
                ip_address as "ipAddress",
                external_reference as "externalReference",
                created_at as "createdAt"
            FROM finance_audit_logs
            WHERE entity_type = $1 AND entity_id = $2
            ORDER BY created_at DESC
            LIMIT $3
        `, entityType, entityId, limit);

        return logs as any[];
    } catch (error) {
        console.error('Failed to get audit logs:', error);
        return [];
    }
}

/**
 * Get audit logs for a tenant within a date range
 */
export async function getAuditLogsByTenant(
    tenantId: string,
    options: {
        startDate?: Date;
        endDate?: Date;
        actionTypes?: FinanceAuditAction[];
        entityTypes?: FinanceEntityType[];
        limit?: number;
    } = {}
): Promise<any[]> {
    try {
        let whereClause = `WHERE tenant_id = $1`;
        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (options.startDate) {
            whereClause += ` AND created_at >= $${paramIndex}`;
            params.push(options.startDate);
            paramIndex++;
        }

        if (options.endDate) {
            whereClause += ` AND created_at <= $${paramIndex}`;
            params.push(options.endDate);
            paramIndex++;
        }

        if (options.actionTypes && options.actionTypes.length > 0) {
            whereClause += ` AND action_type = ANY($${paramIndex}::text[])`;
            params.push(options.actionTypes);
            paramIndex++;
        }

        if (options.entityTypes && options.entityTypes.length > 0) {
            whereClause += ` AND entity_type = ANY($${paramIndex}::text[])`;
            params.push(options.entityTypes);
            paramIndex++;
        }

        const limit = options.limit || 100;
        params.push(limit);

        const logs = await prisma.$queryRawUnsafe(`
            SELECT 
                id,
                tenant_id as "tenantId",
                event_id as "eventId",
                action_type as "actionType",
                action_description as "actionDescription",
                entity_type as "entityType",
                entity_id as "entityId",
                amount,
                currency,
                performed_by_name as "performedByName",
                created_at as "createdAt"
            FROM finance_audit_logs
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex}
        `, ...params);

        return logs as any[];
    } catch (error) {
        console.error('Failed to get audit logs:', error);
        return [];
    }
}
