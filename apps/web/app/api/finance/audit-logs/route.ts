import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/finance/audit-logs - List finance audit logs
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = session.user as any;
        const searchParams = req.nextUrl.searchParams;
        const tenantId = searchParams.get('tenantId') || user.currentTenantId;
        const eventId = searchParams.get('eventId');
        const entityType = searchParams.get('entityType');
        const entityId = searchParams.get('entityId');
        const actionType = searchParams.get('actionType');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '100');

        let whereClause = `WHERE tenant_id = $1`;
        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (eventId) {
            whereClause += ` AND event_id = $${paramIndex}`;
            params.push(BigInt(eventId));
            paramIndex++;
        }

        if (entityType) {
            whereClause += ` AND entity_type = $${paramIndex}`;
            params.push(entityType);
            paramIndex++;
        }

        if (entityId) {
            whereClause += ` AND entity_id = $${paramIndex}`;
            params.push(entityId);
            paramIndex++;
        }

        if (actionType) {
            whereClause += ` AND action_type = $${paramIndex}`;
            params.push(actionType);
            paramIndex++;
        }

        if (startDate) {
            whereClause += ` AND created_at >= $${paramIndex}`;
            params.push(new Date(startDate));
            paramIndex++;
        }

        if (endDate) {
            whereClause += ` AND created_at <= $${paramIndex}`;
            params.push(new Date(endDate));
            paramIndex++;
        }

        params.push(Math.min(limit, 500)); // Cap at 500

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
                webhook_event_id as "webhookEventId",
                created_at as "createdAt"
            FROM finance_audit_logs
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex}
        `, ...params);

        // Get summary stats
        const stats = await prisma.$queryRawUnsafe(`
            SELECT 
                COUNT(*) as total_count,
                COUNT(DISTINCT entity_type) as entity_types_count,
                COUNT(DISTINCT action_type) as action_types_count,
                MIN(created_at) as earliest_log,
                MAX(created_at) as latest_log
            FROM finance_audit_logs
            WHERE tenant_id = $1
        `, tenantId);

        return NextResponse.json({ 
            logs,
            stats: (stats as any[])[0] || {}
        });
    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        
        if (error.message?.includes('does not exist')) {
            return NextResponse.json({ logs: [], stats: {} });
        }
        
        return NextResponse.json({ 
            error: 'Failed to fetch audit logs',
            details: error.message 
        }, { status: 500 });
    }
}
