import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/finance/reports/tax - Generate comprehensive tax/GST report
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = session.user as any;
        const searchParams = req.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const tenantId = searchParams.get('tenantId') || user.currentTenantId;

        console.log('Generating tax report:', { tenantId, startDate, endDate });

        // Build date filter
        const dateFilter: any = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.lte = new Date(endDate);
        }

        // Fetch all invoices with tax information
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
                e.name as event_name,
                e.starts_at as event_date
            FROM invoices i
            LEFT JOIN events e ON i.event_id::text = e.id::text
            WHERE i.tenant_id = $1
            ${startDate ? `AND i.date >= $2` : ''}
            ${endDate ? `AND i.date <= ${startDate ? '$3' : '$2'}` : ''}
            ORDER BY i.date DESC
        `, tenantId, ...(startDate ? [new Date(startDate)] : []), ...(endDate ? [new Date(endDate)] : []));

        // Fetch invoice line items with tax details
        const lineItems = await prisma.$queryRawUnsafe(`
            SELECT 
                ili.invoice_id,
                ili.description,
                ili.quantity,
                ili.unit_price,
                ili.tax_rate,
                ili.tax_amount,
                ili.discount,
                ili.total
            FROM invoice_line_items ili
            INNER JOIN invoices i ON ili.invoice_id = i.id
            WHERE i.tenant_id = $1
            ${startDate ? `AND i.date >= $2` : ''}
            ${endDate ? `AND i.date <= ${startDate ? '$3' : '$2'}` : ''}
        `, tenantId, ...(startDate ? [new Date(startDate)] : []), ...(endDate ? [new Date(endDate)] : []));

        // Calculate tax summary by rate
        const taxSummary: Record<string, {
            rate: number;
            taxableAmount: number;
            taxAmount: number;
            invoiceCount: number;
        }> = {};

        (invoices as any[]).forEach((invoice: any) => {
            const items = (lineItems as any[]).filter((item: any) => item.invoice_id === invoice.id);
            
            items.forEach((item: any) => {
                const rateKey = `${item.tax_rate}%`;
                if (!taxSummary[rateKey]) {
                    taxSummary[rateKey] = {
                        rate: item.tax_rate,
                        taxableAmount: 0,
                        taxAmount: 0,
                        invoiceCount: 0
                    };
                }
                
                const itemSubtotal = item.quantity * item.unit_price - item.discount;
                taxSummary[rateKey].taxableAmount += itemSubtotal;
                taxSummary[rateKey].taxAmount += item.tax_amount;
            });
        });

        // Calculate totals
        const totalInvoices = (invoices as any[]).length;
        const totalSubtotal = (invoices as any[]).reduce((sum: number, inv: any) => sum + parseFloat(inv.subtotal || 0), 0);
        const totalTax = (invoices as any[]).reduce((sum: number, inv: any) => sum + parseFloat(inv.tax_total || 0), 0);
        const totalDiscount = (invoices as any[]).reduce((sum: number, inv: any) => sum + parseFloat(inv.discount_total || 0), 0);
        const totalGrand = (invoices as any[]).reduce((sum: number, inv: any) => sum + parseFloat(inv.grand_total || 0), 0);

        // Status breakdown
        const statusBreakdown = (invoices as any[]).reduce((acc: any, inv: any) => {
            acc[inv.status] = (acc[inv.status] || 0) + 1;
            return acc;
        }, {});

        // Get company tax settings
        const taxSettings = await prisma.$queryRawUnsafe(`
            SELECT 
                fs.default_tax_rate,
                fs.tax_registration_number,
                t.name as company_name,
                t.currency
            FROM finance_settings fs
            INNER JOIN tenants t ON fs.tenant_id = t.id
            WHERE fs.tenant_id = $1
        `, tenantId);

        const report = {
            period: {
                startDate: startDate || 'All time',
                endDate: endDate || 'Present',
                generatedAt: new Date()
            },
            company: (taxSettings as any[])[0] || {},
            summary: {
                totalInvoices,
                totalSubtotal: parseFloat(totalSubtotal.toFixed(2)),
                totalTax: parseFloat(totalTax.toFixed(2)),
                totalDiscount: parseFloat(totalDiscount.toFixed(2)),
                totalGrand: parseFloat(totalGrand.toFixed(2)),
                statusBreakdown
            },
            taxBreakdown: Object.entries(taxSummary).map(([rate, data]) => ({
                taxRate: rate,
                ...data,
                taxableAmount: parseFloat(data.taxableAmount.toFixed(2)),
                taxAmount: parseFloat(data.taxAmount.toFixed(2))
            })),
            invoices: (invoices as any[]).map((inv: any) => ({
                ...inv,
                subtotal: parseFloat(inv.subtotal),
                tax_total: parseFloat(inv.tax_total),
                discount_total: parseFloat(inv.discount_total),
                grand_total: parseFloat(inv.grand_total)
            })),
            lineItems: (lineItems as any[]).map((item: any) => ({
                ...item,
                unit_price: parseFloat(item.unit_price),
                tax_rate: parseFloat(item.tax_rate),
                tax_amount: parseFloat(item.tax_amount),
                discount: parseFloat(item.discount),
                total: parseFloat(item.total)
            }))
        };

        console.log('Tax report generated successfully');

        return NextResponse.json(report);
    } catch (error: any) {
        console.error('Failed to generate tax report:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta
        });
        
        return NextResponse.json({ 
            error: 'Failed to generate tax report', 
            details: error.message 
        }, { status: 500 });
    }
}
