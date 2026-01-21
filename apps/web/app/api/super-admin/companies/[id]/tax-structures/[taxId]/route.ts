import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string; taxId: string }> | { id: string; taxId: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const {
            name, rate, description, isDefault,
            countryCode, currencyCode, effectiveFrom, effectiveTo
        } = body;

        console.log('Updating tax structure:', params.taxId, body);

        // Validate
        if (!name || rate === undefined) {
            return NextResponse.json({ message: 'Name and rate are required' }, { status: 400 });
        }

        const parsedRate = parseFloat(rate);
        if (isNaN(parsedRate)) {
            return NextResponse.json({ message: 'Invalid rate' }, { status: 400 });
        }

        // If setting as default, unset others
        if (isDefault) {
            try {
                await prisma.$executeRawUnsafe(`
                    UPDATE tax_structures 
                    SET is_default = false 
                    WHERE tenant_id = $1 AND is_default = true AND id != $2
                `, params.id, params.taxId);
            } catch (e) {
                console.warn('Could not unset other defaults');
            }
        }

        // Update with new fields if available
        try {
            await prisma.$executeRawUnsafe(`
                UPDATE tax_structures 
                SET 
                    name = $1,
                    rate = $2,
                    description = $3,
                    is_default = $4,
                    country_code = $5,
                    currency_code = $6,
                    effective_from = $7,
                    effective_to = $8,
                    updated_at = NOW()
                WHERE id = $9 AND tenant_id = $10
            `, name, parsedRate, description || '', isDefault || false,
                countryCode || null, currencyCode || 'USD',
                effectiveFrom ? new Date(effectiveFrom) : null,
                effectiveTo ? new Date(effectiveTo) : null,
                params.taxId, params.id);
        } catch (updateError: any) {
            // Fallback to legacy schema
            console.warn('Using legacy schema for update');
            await prisma.$executeRawUnsafe(`
                UPDATE tax_structures 
                SET name = $1, rate = $2, description = $3, is_default = $4, updated_at = NOW()
                WHERE id = $5 AND tenant_id = $6
            `, name, parsedRate, description || '', isDefault || false, params.taxId, params.id);
        }

        // Fetch updated tax
        const tax = await prisma.$queryRawUnsafe(`
            SELECT 
                id, name, rate, description, 
                is_default as "isDefault", 
                COALESCE(is_custom, true) as "isCustom",
                created_at as "createdAt", 
                updated_at as "updatedAt"
            FROM tax_structures 
            WHERE id = $1
        `, params.taxId);

        return NextResponse.json({ tax: (tax as any[])[0] });
    } catch (error: any) {
        console.error('Error updating tax structure:', error);
        return NextResponse.json({ message: 'Failed to update', details: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string; taxId: string }> | { id: string; taxId: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        console.log('Deleting tax structure:', params.taxId);

        // Soft delete (archive) instead of hard delete
        try {
            await prisma.$executeRawUnsafe(`
                UPDATE tax_structures 
                SET archived = TRUE, archived_at = NOW()
                WHERE id = $1 AND tenant_id = $2
            `, params.taxId, params.id);
            console.log('Tax structure archived successfully');
        } catch (archiveError: any) {
            // Fallback to hard delete if archived column doesn't exist
            console.warn('Archived column not available, performing hard delete');
            await prisma.$executeRawUnsafe(`
                DELETE FROM tax_structures 
                WHERE id = $1 AND tenant_id = $2
            `, params.taxId, params.id);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting tax structure:', error);
        return NextResponse.json({ message: 'Failed to delete', details: error.message }, { status: 500 });
    }
}
