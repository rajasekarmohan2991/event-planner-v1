import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCountryByCode, getApplicableCountries, COUNTRY_CURRENCY_MAP } from '@/lib/country-currency-config';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        let taxes: any[] = [];

        // Try to fetch with new columns first, fallback to legacy schema
        try {
            taxes = await prisma.$queryRawUnsafe(`
                SELECT 
                    id, name, rate, description, 
                    is_default as "isDefault", 
                    COALESCE(is_custom, true) as "isCustom",
                    global_template_id as "globalTemplateId",
                    tenant_id as "tenantId", 
                    country_code as "countryCode",
                    currency_code as "currencyCode",
                    effective_from as "effectiveFrom",
                    effective_to as "effectiveTo",
                    archived,
                    created_at as "createdAt", 
                    updated_at as "updatedAt"
                FROM tax_structures 
                WHERE tenant_id = $1 
                  AND (archived = FALSE OR archived IS NULL)
                ORDER BY effective_from DESC NULLS LAST, created_at DESC
            `, params.id) as any[];
            console.log(`Found ${taxes.length} tax structures with enhanced schema`);
        } catch (newColumnsError: any) {
            // Fallback to legacy schema
            console.log('Using legacy schema (new columns not available yet)');
            taxes = await prisma.$queryRawUnsafe(`
                SELECT 
                    id, name, rate, description, 
                    is_default as "isDefault", 
                    COALESCE(is_custom, true) as "isCustom",
                    global_template_id as "globalTemplateId",
                    tenant_id as "tenantId", 
                    created_at as "createdAt", 
                    updated_at as "updatedAt"
                FROM tax_structures 
                WHERE tenant_id = $1 
                ORDER BY created_at DESC
            `, params.id) as any[];
        }

        // Enrich with country information if available
        const enrichedTaxes = taxes.map(tax => {
            if (tax.countryCode) {
                const countryInfo = getCountryByCode(tax.countryCode);
                return {
                    ...tax,
                    countryName: countryInfo?.name,
                    countryFlag: countryInfo?.flag,
                    currencySymbol: countryInfo?.currencySymbol
                };
            }
            return tax;
        });

        return NextResponse.json({ taxes: enrichedTaxes });
    } catch (error: any) {
        console.error('Error fetching taxes:', error);
        return NextResponse.json({
            message: 'Failed to fetch taxes',
            details: error.message
        }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const {
            name,
            rate,
            description,
            isDefault,
            globalTemplateId,
            isCustom,
            countryCode,
            currencyCode,
            effectiveFrom,
            effectiveTo
        } = body;

        console.log('Creating tax structure:', {
            name, rate, countryCode, currencyCode, effectiveFrom, effectiveTo
        });

        // Validate required fields
        if (!name || rate === undefined || rate === null) {
            return NextResponse.json({
                message: 'Name and rate are required',
                details: { name, rate }
            }, { status: 400 });
        }

        const parsedRate = parseFloat(rate);
        if (isNaN(parsedRate)) {
            return NextResponse.json({
                message: 'Rate must be a valid number',
                details: { rate }
            }, { status: 400 });
        }

        // Validate country code if provided
        if (countryCode && !COUNTRY_CURRENCY_MAP[countryCode]) {
            return NextResponse.json({
                message: 'Invalid country code',
                details: { countryCode, validCodes: Object.keys(COUNTRY_CURRENCY_MAP) }
            }, { status: 400 });
        }

        // Auto-fill currency from country if not provided
        let finalCurrencyCode = currencyCode;
        if (countryCode && !currencyCode) {
            const countryInfo = getCountryByCode(countryCode);
            finalCurrencyCode = countryInfo?.currency || 'USD';
        }

        // Validate effective dates
        const effectiveFromDate = effectiveFrom ? new Date(effectiveFrom) : new Date();
        const effectiveToDate = effectiveTo ? new Date(effectiveTo) : null;

        if (effectiveToDate && effectiveToDate <= effectiveFromDate) {
            return NextResponse.json({
                message: 'Effective end date must be after start date',
                details: { effectiveFrom, effectiveTo }
            }, { status: 400 });
        }

        // If setting as default, unset others
        if (isDefault) {
            try {
                await prisma.$executeRawUnsafe(`
                    UPDATE tax_structures 
                    SET is_default = false 
                    WHERE tenant_id = $1 AND is_default = true
                `, params.id);
            } catch (updateError: any) {
                console.warn('Could not unset other defaults:', updateError.message);
            }
        }

        // Create tax structure
        const taxId = `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Try to insert with new columns, fallback to legacy schema
        try {
            await prisma.$executeRawUnsafe(`
                INSERT INTO tax_structures (
                    id, name, rate, description, is_default, tenant_id, 
                    global_template_id, is_custom, created_at, updated_at,
                    country_code, currency_code, effective_from, effective_to
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9, $10, $11, $12)
            `,
                taxId, name, parsedRate, description || '', isDefault || false, params.id,
                globalTemplateId || null, isCustom === true || !globalTemplateId,
                countryCode || null, finalCurrencyCode || 'USD', effectiveFromDate, effectiveToDate
            );
        } catch (insertError: any) {
            // Fallback to legacy schema
            if (insertError.message?.includes('column') || insertError.message?.includes('does not exist')) {
                console.warn('New columns not available, using legacy schema');
                await prisma.$executeRawUnsafe(`
                    INSERT INTO tax_structures (
                        id, name, rate, description, is_default, tenant_id, 
                        global_template_id, is_custom, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                `, taxId, name, parsedRate, description || '', isDefault || false, params.id,
                    globalTemplateId || null, isCustom === true || !globalTemplateId);
            } else {
                throw insertError;
            }
        }

        // Fetch the created tax structure
        const tax = await prisma.$queryRawUnsafe(`
            SELECT 
                id, name, rate, description, 
                is_default as "isDefault", 
                COALESCE(is_custom, true) as "isCustom",
                global_template_id as "globalTemplateId",
                tenant_id as "tenantId", 
                created_at as "createdAt", 
                updated_at as "updatedAt"
            FROM tax_structures 
            WHERE id = $1
        `, taxId);

        console.log('Tax structure created successfully');
        return NextResponse.json({ tax: (tax as any[])[0] }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating tax structure:', error);
        return NextResponse.json({
            message: error.message || 'Failed to create tax structure',
            details: error.code || 'Unknown error'
        }, { status: 500 });
    }
}

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
            await prisma.$executeRawUnsafe(`
                UPDATE tax_structures 
                SET is_default = false 
                WHERE tenant_id = $1 AND is_default = true AND id != $2
            `, params.id, params.taxId);
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
            await prisma.$executeRawUnsafe(`
                UPDATE tax_structures 
                SET name = $1, rate = $2, description = $3, is_default = $4, updated_at = NOW()
                WHERE id = $5 AND tenant_id = $6
            `, name, parsedRate, description || '', isDefault || false, params.taxId, params.id);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating tax structure:', error);
        return NextResponse.json({ message: 'Failed to update' }, { status: 500 });
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
        // Soft delete (archive) instead of hard delete
        try {
            await prisma.$executeRawUnsafe(`
                UPDATE tax_structures 
                SET archived = TRUE, archived_at = NOW()
                WHERE id = $1 AND tenant_id = $2
            `, params.taxId, params.id);
        } catch (archiveError: any) {
            // Fallback to hard delete if archived column doesn't exist
            await prisma.$executeRawUnsafe(`
                DELETE FROM tax_structures 
                WHERE id = $1 AND tenant_id = $2
            `, params.taxId, params.id);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting tax structure:', error);
        return NextResponse.json({ message: 'Failed to delete' }, { status: 500 });
    }
}
