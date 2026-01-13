import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ensureSchema } from '@/lib/ensure-schema';

export const dynamic = 'force-dynamic';

// GET /api/super-admin/companies/[id]/convenience-fees - Get company convenience fee config
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = 'then' in context.params ? await context.params : context.params;
    const companyId = params.id;

    try {
        const fees = await prisma.$queryRaw<any[]>`
            SELECT 
                id,
                tenant_id as "tenantId",
                fee_type as "feeType",
                percentage_fee as "percentageFee",
                fixed_fee as "fixedFee",
                applies_to as "appliesTo",
                pass_fee_to_customer as "passFeeToCustomer",
                minimum_fee as "minimumFee",
                maximum_fee as "maximumFee",
                display_name as "displayName",
                description,
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM convenience_fee_config
            WHERE tenant_id = ${companyId}
              AND event_id IS NULL
            LIMIT 1
        `;

        if (fees.length === 0) {
            return NextResponse.json({
                config: null,
                message: 'No convenience fee configured for this company'
            });
        }

        return NextResponse.json({ config: fees[0] });
    } catch (error: any) {
        console.error('Error fetching convenience fees:', error);

        // Auto-heal schema if table doesn't exist
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            try {
                await ensureSchema();
                return NextResponse.json({
                    error: 'Database schema updated. Please refresh.',
                    needsRetry: true
                }, { status: 503 });
            } catch (schemaError) {
                console.error('Schema healing failed:', schemaError);
            }
        }

        return NextResponse.json({
            error: 'Failed to fetch convenience fees',
            details: error.message
        }, { status: 500 });
    }
}

// POST /api/super-admin/companies/[id]/convenience-fees - Create or update convenience fee config
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = 'then' in context.params ? await context.params : context.params;
    const companyId = params.id;

    try {
        const body = await req.json();
        const {
            feeType,
            percentageFee,
            fixedFee,
            appliesTo,
            passFeeToCustomer,
            minimumFee,
            maximumFee,
            displayName,
            description
        } = body;

        // Validate required fields
        if (!feeType || !displayName) {
            return NextResponse.json({
                error: 'Missing required fields',
                details: 'feeType and displayName are required'
            }, { status: 400 });
        }

        // Validate fee type
        if (!['PERCENTAGE', 'FIXED', 'HYBRID'].includes(feeType)) {
            return NextResponse.json({
                error: 'Invalid fee type',
                details: 'feeType must be PERCENTAGE, FIXED, or HYBRID'
            }, { status: 400 });
        }

        // Check if config already exists
        const existing = await prisma.$queryRaw<any[]>`
            SELECT id FROM convenience_fee_config 
            WHERE tenant_id = ${companyId} AND event_id IS NULL
            LIMIT 1
        `;

        const configId = existing.length > 0 
            ? existing[0].id 
            : `fee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (existing.length > 0) {
            // Update existing config
            await prisma.$executeRaw`
                UPDATE convenience_fee_config
                SET 
                    fee_type = ${feeType},
                    percentage_fee = ${percentageFee || 0},
                    fixed_fee = ${fixedFee || 0},
                    applies_to = ${appliesTo || 'ALL'},
                    pass_fee_to_customer = ${passFeeToCustomer !== false},
                    minimum_fee = ${minimumFee || null},
                    maximum_fee = ${maximumFee || null},
                    display_name = ${displayName},
                    description = ${description || null},
                    updated_at = NOW()
                WHERE tenant_id = ${companyId} AND event_id IS NULL
            `;
        } else {
            // Create new config
            await prisma.$executeRaw`
                INSERT INTO convenience_fee_config (
                    id, tenant_id, fee_type, percentage_fee, fixed_fee,
                    applies_to, pass_fee_to_customer, minimum_fee, maximum_fee,
                    display_name, description, created_at, updated_at
                ) VALUES (
                    ${configId}, ${companyId}, ${feeType}, ${percentageFee || 0}, ${fixedFee || 0},
                    ${appliesTo || 'ALL'}, ${passFeeToCustomer !== false}, ${minimumFee || null}, ${maximumFee || null},
                    ${displayName}, ${description || null}, NOW(), NOW()
                )
            `;
        }

        // Fetch and return updated config
        const updated = await prisma.$queryRaw<any[]>`
            SELECT 
                id,
                tenant_id as "tenantId",
                fee_type as "feeType",
                percentage_fee as "percentageFee",
                fixed_fee as "fixedFee",
                applies_to as "appliesTo",
                pass_fee_to_customer as "passFeeToCustomer",
                minimum_fee as "minimumFee",
                maximum_fee as "maximumFee",
                display_name as "displayName",
                description,
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM convenience_fee_config
            WHERE tenant_id = ${companyId} AND event_id IS NULL
            LIMIT 1
        `;

        return NextResponse.json({
            config: updated[0],
            message: existing.length > 0 ? 'Convenience fee updated' : 'Convenience fee created'
        }, { status: existing.length > 0 ? 200 : 201 });
    } catch (error: any) {
        console.error('Error saving convenience fee:', error);

        // Auto-heal schema if table doesn't exist
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            try {
                await ensureSchema();
                return NextResponse.json({
                    error: 'Database schema updated. Please retry.',
                    needsRetry: true
                }, { status: 503 });
            } catch (schemaError) {
                console.error('Schema healing failed:', schemaError);
            }
        }

        return NextResponse.json({
            error: 'Failed to save convenience fee',
            details: error.message
        }, { status: 500 });
    }
}

// DELETE /api/super-admin/companies/[id]/convenience-fees - Remove convenience fee config
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = 'then' in context.params ? await context.params : context.params;
    const companyId = params.id;

    try {
        await prisma.$executeRaw`
            DELETE FROM convenience_fee_config 
            WHERE tenant_id = ${companyId} AND event_id IS NULL
        `;

        return NextResponse.json({
            message: 'Convenience fee configuration removed'
        });
    } catch (error: any) {
        console.error('Error deleting convenience fee:', error);
        return NextResponse.json({
            error: 'Failed to delete convenience fee',
            details: error.message
        }, { status: 500 });
    }
}
