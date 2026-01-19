import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/finance/invoices - List all invoices for a tenant
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        const searchParams = req.nextUrl.searchParams;
        const tenantId = searchParams.get('tenantId') || user.currentTenantId;
        const status = searchParams.get('status');
        const eventId = searchParams.get('eventId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        // Build WHERE clause
        let whereClause = `WHERE i.tenant_id = $1`;
        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (status) {
            whereClause += ` AND i.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (eventId) {
            whereClause += ` AND i.event_id = $${paramIndex}`;
            params.push(eventId);
            paramIndex++;
        }

        // Fetch invoices
        const invoices = await prisma.$queryRawUnsafe(`
            SELECT 
                i.id,
                i.number,
                i.date,
                i.due_date,
                i.payment_terms,
                i.recipient_type,
                i.recipient_name,
                i.recipient_email,
                i.recipient_tax_id,
                i.currency,
                i.status,
                i.subtotal,
                i.tax_total,
                i.discount_total,
                i.grand_total,
                i.sent_at,
                i.sent_to,
                i.paid_at,
                i.payment_method,
                i.notes,
                i.created_at,
                i.updated_at,
                e.name as event_name,
                e.start_date as event_date
            FROM invoices i
            LEFT JOIN events e ON i.event_id = e.id
            ${whereClause}
            ORDER BY i.date DESC, i.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, ...params, limit, offset);

        // Get total count
        const countResult = await prisma.$queryRawUnsafe<any[]>(`
            SELECT COUNT(*) as total
            FROM invoices i
            ${whereClause}
        `, ...params);

        const total = parseInt(countResult[0]?.total || '0');

        return NextResponse.json({
            invoices: (invoices as any[]).map((inv: any) => ({
                ...inv,
                subtotal: parseFloat(inv.subtotal || 0),
                tax_total: parseFloat(inv.tax_total || 0),
                discount_total: parseFloat(inv.discount_total || 0),
                grand_total: parseFloat(inv.grand_total || 0)
            })),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });
    } catch (error: any) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch invoices',
                details: error.message 
            },
            { status: 500 }
        );
    }
}

// POST /api/finance/invoices - Create new invoice
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        const body = await req.json();
        const {
            eventId,
            recipientType,
            recipientName,
            recipientEmail,
            recipientTaxId,
            currency,
            paymentTerms,
            lineItems,
            notes
        } = body;

        const tenantId = user.currentTenantId;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        // Validation
        if (!recipientName || !recipientEmail || !lineItems || lineItems.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate invoice number
        const invoiceCount = await prisma.$queryRawUnsafe<any[]>(`
            SELECT COUNT(*) as count FROM invoices WHERE tenant_id = $1
        `, tenantId);
        const invoiceNumber = `INV-${String((parseInt(invoiceCount[0]?.count || '0') + 1)).padStart(6, '0')}`;

        // Calculate totals
        let subtotal = 0;
        let taxTotal = 0;
        let discountTotal = 0;

        lineItems.forEach((item: any) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemDiscount = item.discount || 0;
            const itemTaxable = itemSubtotal - itemDiscount;
            const itemTax = itemTaxable * (item.taxRate / 100);

            subtotal += itemSubtotal;
            discountTotal += itemDiscount;
            taxTotal += itemTax;
        });

        const grandTotal = subtotal - discountTotal + taxTotal;

        // Calculate due date
        const invoiceDate = new Date();
        const dueDate = new Date(invoiceDate);
        const paymentDays = paymentTerms === 'NET_15' ? 15 : paymentTerms === 'NET_60' ? 60 : 30;
        dueDate.setDate(dueDate.getDate() + paymentDays);

        // Create invoice
        const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await prisma.$executeRaw`
            INSERT INTO invoices (
                id, tenant_id, event_id, number, date, due_date, payment_terms,
                recipient_type, recipient_name, recipient_email, recipient_tax_id,
                currency, status, subtotal, tax_total, discount_total, grand_total, notes
            ) VALUES (
                ${invoiceId}, ${tenantId}, ${eventId ? BigInt(eventId) : null}, ${invoiceNumber},
                ${invoiceDate}, ${dueDate}, ${paymentTerms || 'NET_30'},
                ${recipientType || 'INDIVIDUAL'}, ${recipientName}, ${recipientEmail}, ${recipientTaxId},
                ${currency || 'USD'}, 'DRAFT', ${subtotal}, ${taxTotal}, ${discountTotal}, ${grandTotal}, ${notes}
            )
        `;

        // Create line items
        for (const item of lineItems) {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemDiscount = item.discount || 0;
            const itemTaxable = itemSubtotal - itemDiscount;
            const itemTax = itemTaxable * (item.taxRate / 100);
            const itemTotal = itemTaxable + itemTax;

            await prisma.$executeRaw`
                INSERT INTO invoice_line_items (
                    invoice_id, description, quantity, unit_price, 
                    tax_rate, tax_amount, discount, total
                ) VALUES (
                    ${invoiceId}, ${item.description}, ${item.quantity}, ${item.unitPrice},
                    ${item.taxRate || 0}, ${itemTax}, ${itemDiscount}, ${itemTotal}
                )
            `;
        }

        return NextResponse.json({
            message: 'Invoice created successfully',
            invoice: {
                id: invoiceId,
                number: invoiceNumber,
                grandTotal
            }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating invoice:', error);
        return NextResponse.json(
            { 
                error: 'Failed to create invoice',
                details: error.message 
            },
            { status: 500 }
        );
    }
}
