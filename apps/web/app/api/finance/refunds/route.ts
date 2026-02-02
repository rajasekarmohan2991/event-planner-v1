import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/finance/refunds - List refund requests
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
        const status = searchParams.get('status');
        const requesterType = searchParams.get('requesterType');

        let whereClause = `WHERE tenant_id = $1`;
        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (eventId) {
            whereClause += ` AND event_id = $${paramIndex}`;
            params.push(BigInt(eventId));
            paramIndex++;
        }

        if (status) {
            whereClause += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (requesterType) {
            whereClause += ` AND requester_type = $${paramIndex}`;
            params.push(requesterType);
            paramIndex++;
        }

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
                created_at as "createdAt"
            FROM refund_requests
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT 100
        `, ...params);

        // Calculate summary
        const summary = await prisma.$queryRawUnsafe(`
            SELECT 
                COUNT(*) as total_count,
                COALESCE(SUM(refund_amount), 0) as total_refund_amount,
                COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count,
                COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count,
                COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_count
            FROM refund_requests
            ${whereClause}
        `, ...params);

        return NextResponse.json({ 
            refunds,
            summary: (summary as any[])[0] || {}
        });
    } catch (error: any) {
        console.error('Error fetching refund requests:', error);
        
        if (error.message?.includes('does not exist')) {
            return NextResponse.json({ refunds: [], summary: {} });
        }
        
        return NextResponse.json({ 
            error: 'Failed to fetch refund requests',
            details: error.message 
        }, { status: 500 });
    }
}

// POST /api/finance/refunds - Create refund request
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = session.user as any;
        const body = await req.json();
        const {
            tenantId,
            eventId,
            paymentId,
            invoiceId,
            orderId,
            requesterType,
            requesterId,
            requesterName,
            requesterEmail,
            originalAmount,
            refundAmount,
            currency = 'USD',
            reasonCategory,
            reasonDescription,
            isPartial = false,
            partialReason
        } = body;

        const finalTenantId = tenantId || user.currentTenantId;

        // Validate required fields
        if (!paymentId || !requesterType || !requesterName || !requesterEmail || !originalAmount || !refundAmount) {
            return NextResponse.json({ 
                error: 'Missing required fields',
                details: 'paymentId, requesterType, requesterName, requesterEmail, originalAmount, and refundAmount are required'
            }, { status: 400 });
        }

        // Validate refund amount
        if (refundAmount > originalAmount) {
            return NextResponse.json({ 
                error: 'Invalid refund amount',
                details: 'Refund amount cannot exceed original amount'
            }, { status: 400 });
        }

        // Check if partial refund
        const actualIsPartial = refundAmount < originalAmount;
        if (actualIsPartial && !partialReason) {
            return NextResponse.json({ 
                error: 'Partial reason required',
                details: 'Please provide a reason for partial refund'
            }, { status: 400 });
        }

        const id = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await prisma.$executeRawUnsafe(`
            INSERT INTO refund_requests (
                id, tenant_id, event_id, payment_id, invoice_id, order_id,
                requester_type, requester_id, requester_name, requester_email,
                original_amount, refund_amount, currency,
                reason_category, reason_description, status,
                is_partial, partial_reason,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
            )
        `,
            id,
            finalTenantId,
            eventId ? BigInt(eventId) : null,
            paymentId,
            invoiceId || null,
            orderId || null,
            requesterType,
            requesterId || null,
            requesterName,
            requesterEmail,
            originalAmount,
            refundAmount,
            currency,
            reasonCategory || 'CUSTOMER_REQUEST',
            reasonDescription || null,
            'PENDING',
            actualIsPartial,
            actualIsPartial ? (partialReason || 'Partial refund requested') : null
        );

        return NextResponse.json({
            success: true,
            refund: {
                id,
                paymentId,
                requesterName,
                requesterEmail,
                originalAmount,
                refundAmount,
                currency,
                isPartial: actualIsPartial,
                status: 'PENDING'
            }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating refund request:', error);
        return NextResponse.json({ 
            error: 'Failed to create refund request',
            details: error.message 
        }, { status: 500 });
    }
}
