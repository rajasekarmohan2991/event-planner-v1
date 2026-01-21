
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getTaxTemplatesForCountry, getCountryFromCurrency } from '@/lib/tax-templates';
import { ensureSchema } from '@/lib/ensure-schema';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const session = await getServerSession(authOptions as any);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        // Use raw query to avoid schema issues with country field
        let taxes: any[] = [];

        try {
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
            console.log(`Found ${taxes.length} existing tax structures for tenant ${params.id}`);
        } catch (tableError: any) {
            console.log('Tax structures table may not exist, running schema update...', tableError.message);
            await ensureSchema();
            taxes = [];
        }

        // If no tax structures exist, auto-populate based on company country or currency
        if (taxes.length === 0) {
            console.log('No tax structures found, auto-populating based on country/currency...');

            // Try to get company with country, fallback to currency-based detection
            let country = 'US'; // Default
            let currency = 'USD';

            try {
                const companyData: any[] = await prisma.$queryRawUnsafe(`
                    SELECT country, currency FROM tenants WHERE id = $1
                `, params.id);

                if (companyData.length > 0) {
                    country = companyData[0].country || getCountryFromCurrency(companyData[0].currency || 'USD');
                    currency = companyData[0].currency || 'USD';
                }
            } catch (e) {
                // country column might not exist, try just currency
                const companyData: any[] = await prisma.$queryRawUnsafe(`
                    SELECT currency FROM tenants WHERE id = $1
                `, params.id);

                if (companyData.length > 0) {
                    currency = companyData[0].currency || 'USD';
                    country = getCountryFromCurrency(currency);
                }
            }

            console.log(`Detected country: ${country}, currency: ${currency}`);
            const templates = getTaxTemplatesForCountry(country);
            console.log(`Creating ${templates.length} tax structures for country: ${country}`);

            // Create tax structures from templates using raw SQL
            for (const template of templates) {
                const id = `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await prisma.$executeRawUnsafe(`
                    INSERT INTO tax_structures (id, name, rate, description, is_default, tenant_id, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
                `, id, template.name, template.rate, template.description || '', template.isDefault, params.id);
            }

            // Fetch the newly created taxes
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

            console.log(`Successfully created ${taxes.length} tax structures`);
        }

        return NextResponse.json({ taxes });
    } catch (error: any) {
        console.error('Error fetching/creating taxes:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta
        });
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
        const { name, rate, description, isDefault, globalTemplateId, isCustom } = body;

        console.log('Creating tax structure:', { name, rate, description, isDefault, globalTemplateId, isCustom, tenantId: params.id });

        // Validate required fields
        if (!name || rate === undefined || rate === null) {
            return NextResponse.json({
                message: 'Name and rate are required',
                details: { name, rate }
            }, { status: 400 });
        }

        // Validate rate is a valid number
        const parsedRate = parseFloat(rate);
        if (isNaN(parsedRate)) {
            return NextResponse.json({
                message: 'Rate must be a valid number',
                details: { rate }
            }, { status: 400 });
        }

        // If using a global template, verify it exists
        if (globalTemplateId) {
            const template = await prisma.$queryRawUnsafe(`
                SELECT id FROM global_tax_templates WHERE id = $1
            `, globalTemplateId);
            if ((template as any[]).length === 0) {
                return NextResponse.json({
                    message: 'Global tax template not found',
                    details: { globalTemplateId }
                }, { status: 400 });
            }
        }

        // If setting as default, unset others
        if (isDefault) {
            await prisma.$executeRawUnsafe(`
                UPDATE tax_structures 
                SET is_default = false 
                WHERE tenant_id = $1 AND is_default = true
            `, params.id);
        }

        // Create tax structure using raw SQL
        const taxId = `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await prisma.$executeRawUnsafe(`
            INSERT INTO tax_structures (
                id, name, rate, description, is_default, tenant_id, 
                global_template_id, is_custom, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        `, taxId, name, parsedRate, description || '', isDefault || false, params.id, globalTemplateId || null, isCustom === true || !globalTemplateId);

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

        console.log('Tax structure created successfully:', (tax as any[])[0]);
        return NextResponse.json({ tax: (tax as any[])[0] }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating tax structure:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        return NextResponse.json({
            message: error.message || 'Failed to create tax structure',
            details: error.meta || error.code || 'Unknown error'
        }, { status: 500 });
    }
}
