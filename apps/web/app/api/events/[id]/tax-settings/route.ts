import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ensureSchema } from '@/lib/ensure-schema';

// GET /api/events/[id]/tax-settings - Get event tax configuration
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = 'then' in context.params ? await context.params : context.params;
    const eventId = params.id;

    try {
        // Get event tax settings
        const settings = await prisma.$queryRaw<any[]>`
            SELECT 
                id,
                event_id as "eventId",
                tenant_id as "tenantId",
                use_custom_tax as "useCustomTax",
                tax_structure_id as "taxStructureId",
                custom_tax_rate as "customTaxRate",
                custom_tax_name as "customTaxName",
                is_tax_exempt as "isTaxExempt",
                exemption_reason as "exemptionReason",
                exemption_certificate_url as "exemptionCertificateUrl",
                tax_invoice_prefix as "taxInvoicePrefix",
                include_tax_breakdown as "includeTaxBreakdown",
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM event_tax_settings
            WHERE event_id = ${eventId}
            LIMIT 1
        `;

        if (settings.length === 0) {
            // Return default settings if none exist
            return NextResponse.json({
                settings: {
                    eventId,
                    useCustomTax: false,
                    isTaxExempt: false,
                    includeTaxBreakdown: true,
                },
                isDefault: true
            });
        }

        return NextResponse.json({
            settings: settings[0],
            isDefault: false
        });
    } catch (error: any) {
        console.error('Error fetching event tax settings:', error);

        // If table doesn't exist, create it
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
            error: 'Failed to fetch event tax settings',
            details: error.message
        }, { status: 500 });
    }
}

// POST /api/events/[id]/tax-settings - Create or update event tax configuration
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = 'then' in context.params ? await context.params : context.params;
    const eventId = params.id;

    try {
        const body = await req.json();
        const {
            useCustomTax,
            taxStructureId,
            customTaxRate,
            customTaxName,
            isTaxExempt,
            exemptionReason,
            exemptionCertificateUrl,
            taxInvoicePrefix,
            includeTaxBreakdown
        } = body;

        // Get tenant ID from event
        const events = await prisma.$queryRaw<any[]>`
            SELECT tenant_id FROM events WHERE id = ${eventId} LIMIT 1
        `;

        if (events.length === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const tenantId = events[0].tenant_id;

        // Check if settings already exist
        const existing = await prisma.$queryRaw<any[]>`
            SELECT id FROM event_tax_settings WHERE event_id = ${eventId} LIMIT 1
        `;

        const settingsId = existing.length > 0 ? existing[0].id : `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (existing.length > 0) {
            // Update existing settings
            await prisma.$executeRaw`
                UPDATE event_tax_settings
                SET 
                    use_custom_tax = ${useCustomTax || false},
                    tax_structure_id = ${taxStructureId || null},
                    custom_tax_rate = ${customTaxRate || null},
                    custom_tax_name = ${customTaxName || null},
                    is_tax_exempt = ${isTaxExempt || false},
                    exemption_reason = ${exemptionReason || null},
                    exemption_certificate_url = ${exemptionCertificateUrl || null},
                    tax_invoice_prefix = ${taxInvoicePrefix || null},
                    include_tax_breakdown = ${includeTaxBreakdown !== false},
                    updated_at = NOW()
                WHERE event_id = ${eventId}
            `;
        } else {
            // Create new settings
            await prisma.$executeRaw`
                INSERT INTO event_tax_settings (
                    id, event_id, tenant_id,
                    use_custom_tax, tax_structure_id, custom_tax_rate, custom_tax_name,
                    is_tax_exempt, exemption_reason, exemption_certificate_url,
                    tax_invoice_prefix, include_tax_breakdown,
                    created_at, updated_at
                ) VALUES (
                    ${settingsId}, ${eventId}, ${tenantId},
                    ${useCustomTax || false}, ${taxStructureId || null}, ${customTaxRate || null}, ${customTaxName || null},
                    ${isTaxExempt || false}, ${exemptionReason || null}, ${exemptionCertificateUrl || null},
                    ${taxInvoicePrefix || null}, ${includeTaxBreakdown !== false},
                    NOW(), NOW()
                )
            `;
        }

        // Fetch and return updated settings
        const updated = await prisma.$queryRaw<any[]>`
            SELECT 
                id,
                event_id as "eventId",
                tenant_id as "tenantId",
                use_custom_tax as "useCustomTax",
                tax_structure_id as "taxStructureId",
                custom_tax_rate as "customTaxRate",
                custom_tax_name as "customTaxName",
                is_tax_exempt as "isTaxExempt",
                exemption_reason as "exemptionReason",
                exemption_certificate_url as "exemptionCertificateUrl",
                tax_invoice_prefix as "taxInvoicePrefix",
                include_tax_breakdown as "includeTaxBreakdown",
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM event_tax_settings
            WHERE event_id = ${eventId}
            LIMIT 1
        `;

        return NextResponse.json({
            settings: updated[0],
            message: existing.length > 0 ? 'Tax settings updated' : 'Tax settings created'
        }, { status: existing.length > 0 ? 200 : 201 });
    } catch (error: any) {
        console.error('Error saving event tax settings:', error);

        // If table doesn't exist, create it
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
            error: 'Failed to save event tax settings',
            details: error.message
        }, { status: 500 });
    }
}

// DELETE /api/events/[id]/tax-settings - Reset to company defaults
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = 'then' in context.params ? await context.params : context.params;
    const eventId = params.id;

    try {
        await prisma.$executeRaw`
            DELETE FROM event_tax_settings WHERE event_id = ${eventId}
        `;

        return NextResponse.json({
            message: 'Event tax settings reset to company defaults'
        });
    } catch (error: any) {
        console.error('Error deleting event tax settings:', error);
        return NextResponse.json({
            error: 'Failed to delete event tax settings',
            details: error.message
        }, { status: 500 });
    }
}
