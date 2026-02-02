import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/finance/tds/[id] - Get single TDS deduction
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
        const deductions = await prisma.$queryRawUnsafe(`
            SELECT 
                id,
                tenant_id as "tenantId",
                event_id as "eventId",
                payout_id as "payoutId",
                recipient_type as "recipientType",
                recipient_id as "recipientId",
                recipient_name as "recipientName",
                recipient_pan as "recipientPan",
                section,
                tds_rate as "tdsRate",
                gross_amount as "grossAmount",
                tds_amount as "tdsAmount",
                net_amount as "netAmount",
                currency,
                status,
                deducted_at as "deductedAt",
                deposited_at as "depositedAt",
                certificate_number as "certificateNumber",
                certificate_issued_at as "certificateIssuedAt",
                financial_year as "financialYear",
                quarter,
                notes,
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM tds_deductions
            WHERE id = $1
        `, params.id);

        if ((deductions as any[]).length === 0) {
            return NextResponse.json({ error: 'TDS deduction not found' }, { status: 404 });
        }

        return NextResponse.json({ tds: (deductions as any[])[0] });
    } catch (error: any) {
        console.error('Error fetching TDS deduction:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch TDS deduction',
            details: error.message 
        }, { status: 500 });
    }
}

// PATCH /api/finance/tds/[id] - Update TDS deduction status
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
        const body = await req.json();
        const {
            status,
            certificateNumber,
            notes
        } = body;

        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (status) {
            updates.push(`status = $${paramIndex}`);
            values.push(status);
            paramIndex++;

            // Set timestamp based on status
            if (status === 'DEDUCTED') {
                updates.push(`deducted_at = NOW()`);
            } else if (status === 'DEPOSITED') {
                updates.push(`deposited_at = NOW()`);
            } else if (status === 'CERTIFICATE_ISSUED') {
                updates.push(`certificate_issued_at = NOW()`);
            }
        }

        if (certificateNumber) {
            updates.push(`certificate_number = $${paramIndex}`);
            values.push(certificateNumber);
            paramIndex++;
        }

        if (notes !== undefined) {
            updates.push(`notes = $${paramIndex}`);
            values.push(notes);
            paramIndex++;
        }

        updates.push('updated_at = NOW()');

        if (updates.length === 1) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        values.push(params.id);

        await prisma.$executeRawUnsafe(`
            UPDATE tds_deductions
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex}
        `, ...values);

        return NextResponse.json({ 
            success: true,
            message: 'TDS deduction updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating TDS deduction:', error);
        return NextResponse.json({ 
            error: 'Failed to update TDS deduction',
            details: error.message 
        }, { status: 500 });
    }
}

// DELETE /api/finance/tds/[id] - Delete TDS deduction
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Only allow deletion of PENDING TDS records
        const existing = await prisma.$queryRawUnsafe(`
            SELECT status FROM tds_deductions WHERE id = $1
        `, params.id);

        if ((existing as any[]).length === 0) {
            return NextResponse.json({ error: 'TDS deduction not found' }, { status: 404 });
        }

        if ((existing as any[])[0].status !== 'PENDING') {
            return NextResponse.json({ 
                error: 'Cannot delete TDS deduction',
                details: 'Only PENDING TDS records can be deleted'
            }, { status: 400 });
        }

        await prisma.$executeRawUnsafe(`
            DELETE FROM tds_deductions WHERE id = $1
        `, params.id);

        return NextResponse.json({ 
            success: true,
            message: 'TDS deduction deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting TDS deduction:', error);
        return NextResponse.json({ 
            error: 'Failed to delete TDS deduction',
            details: error.message 
        }, { status: 500 });
    }
}
