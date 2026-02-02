import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getInvoiceHTML } from '@/lib/invoice-pdf';

export const dynamic = 'force-dynamic';

// GET /api/finance/invoices/[id]/pdf - Get invoice as HTML (for printing/PDF)
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
        const format = req.nextUrl.searchParams.get('format') || 'html';
        
        const html = await getInvoiceHTML(params.id);
        
        if (!html) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (format === 'json') {
            return NextResponse.json({ html });
        }

        // Return as HTML for browser printing/PDF generation
        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `inline; filename="invoice-${params.id}.html"`
            }
        });
    } catch (error: any) {
        console.error('Error generating invoice PDF:', error);
        return NextResponse.json({ 
            error: 'Failed to generate invoice',
            details: error.message 
        }, { status: 500 });
    }
}
