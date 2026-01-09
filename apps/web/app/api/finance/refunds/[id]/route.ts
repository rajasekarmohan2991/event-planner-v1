import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/finance/refunds/[id] - Get single refund request
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const refunds = await prisma.$queryRawUnsafe(`
            SELECT 
                id,
                tenant_id as "tenantId",
                event_id as "eventId",
                payment_id as "paymentId",
                invoice_id as "invoiceId",
                order_id as "orderId",
                requester_type as "requesterType",
                requester_id as "requesterId",
                requester_name as "requesterName",
                requester_email as "requesterEmail",
                original_amount as "originalAmount",
                refund_amount as "refundAmount",
                currency,
                reason_category as "reasonCategory",
                reason_description as "reasonDescription",
                status,
                approved_by_user_id as "approvedByUserId",
                approved_at as "approvedAt",
                rejection_reason as "rejectionReason",
                gateway_refund_id as "gatewayRefundId",
                processed_at as "processedAt",
                processing_error as "processingError",
                is_partial as "isPartial",
                partial_reason as "partialReason",
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM refund_requests
            WHERE id = $1
        `, params.id);

        if ((refunds as any[]).length === 0) {
            return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
        }

        return NextResponse.json({ refund: (refunds as any[])[0] });
    } catch (error: any) {
        console.error('Error fetching refund request:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch refund request',
            details: error.message 
        }, { status: 500 });
    }
}

// PATCH /api/finance/refunds/[id] - Update refund request (approve/reject/process)
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = session.user as any;
        const body = await req.json();
        const {
            action, // APPROVE, REJECT, PROCESS, COMPLETE, FAIL
            rejectionReason,
            gatewayRefundId,
            processingError
        } = body;

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 });
        }

        // Get current refund status
        const existing = await prisma.$queryRawUnsafe(`
            SELECT status FROM refund_requests WHERE id = $1
        `, params.id);

        if ((existing as any[]).length === 0) {
            return NextResponse.json({ error: 'Refund request not found' }, { status: 404 });
        }

        const currentStatus = (existing as any[])[0].status;

        // Validate state transitions
        const validTransitions: Record<string, string[]> = {
            'PENDING': ['APPROVED', 'REJECTED'],
            'APPROVED': ['PROCESSING'],
            'PROCESSING': ['COMPLETED', 'FAILED'],
            'FAILED': ['PROCESSING'] // Allow retry
        };

        const actionToStatus: Record<string, string> = {
            'APPROVE': 'APPROVED',
            'REJECT': 'REJECTED',
            'PROCESS': 'PROCESSING',
            'COMPLETE': 'COMPLETED',
            'FAIL': 'FAILED'
        };

        const newStatus = actionToStatus[action];
        if (!newStatus) {
            return NextResponse.json({ 
                error: 'Invalid action',
                validActions: Object.keys(actionToStatus)
            }, { status: 400 });
        }

        if (!validTransitions[currentStatus]?.includes(newStatus)) {
            return NextResponse.json({ 
                error: 'Invalid state transition',
                details: `Cannot transition from ${currentStatus} to ${newStatus}`
            }, { status: 400 });
        }

        // Build update query
        const updates: string[] = [`status = $1`];
        const values: any[] = [newStatus];
        let paramIndex = 2;

        if (action === 'APPROVE') {
            updates.push(`approved_by_user_id = $${paramIndex}`);
            values.push(user.id ? BigInt(user.id) : null);
            paramIndex++;
            updates.push(`approved_at = NOW()`);
        }

        if (action === 'REJECT' && rejectionReason) {
            updates.push(`rejection_reason = $${paramIndex}`);
            values.push(rejectionReason);
            paramIndex++;
        }

        if (action === 'COMPLETE' && gatewayRefundId) {
            updates.push(`gateway_refund_id = $${paramIndex}`);
            values.push(gatewayRefundId);
            paramIndex++;
            updates.push(`processed_at = NOW()`);
        }

        if (action === 'FAIL' && processingError) {
            updates.push(`processing_error = $${paramIndex}`);
            values.push(processingError);
            paramIndex++;
        }

        updates.push('updated_at = NOW()');
        values.push(params.id);

        await prisma.$executeRawUnsafe(`
            UPDATE refund_requests
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
        `, ...values);

        return NextResponse.json({ 
            success: true,
            message: `Refund request ${action.toLowerCase()}d successfully`,
            newStatus
        });
    } catch (error: any) {
        console.error('Error updating refund request:', error);
        return NextResponse.json({ 
            error: 'Failed to update refund request',
            details: error.message 
        }, { status: 500 });
    }
}
