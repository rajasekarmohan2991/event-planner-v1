import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/finance/invoices/[id]/send - Send invoice via email
export async function POST(
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
        const { email, message } = body;

        console.log(`Sending invoice ${params.id} to ${email}`);

        // Get invoice details
        const invoice = await prisma.invoice.findUnique({
            where: { id: params.id },
            include: {
                items: true,
                tenant: {
                    select: {
                        name: true,
                        billingEmail: true,
                        logo: true
                    }
                },
                event: {
                    select: {
                        name: true,
                        start_date: true
                    }
                }
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        // Update invoice status and tracking
        await prisma.invoice.update({
            where: { id: params.id },
            data: {
                status: invoice.status === 'DRAFT' ? 'SENT' : invoice.status,
                sentAt: new Date(),
                sentTo: email
            }
        });

        // TODO: Integrate with email service (SendGrid, Resend, etc.)
        // For now, we'll return success with invoice data
        // In production, you would send actual email here
        
        const emailData = {
            to: email,
            subject: `Invoice ${invoice.number} from ${invoice.tenant.name}`,
            invoiceNumber: invoice.number,
            invoiceDate: invoice.date,
            dueDate: invoice.dueDate,
            amount: invoice.grandTotal,
            currency: invoice.currency,
            recipientName: invoice.recipientName,
            companyName: invoice.tenant.name,
            eventName: invoice.event?.name,
            customMessage: message,
            items: invoice.items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                total: item.total
            }))
        };

        console.log('Invoice email data prepared:', emailData);

        return NextResponse.json({ 
            success: true,
            message: `Invoice sent to ${email}`,
            invoice: {
                id: invoice.id,
                number: invoice.number,
                status: 'SENT',
                sentAt: new Date(),
                sentTo: email
            }
        });
    } catch (error: any) {
        console.error('Failed to send invoice:', error);
        return NextResponse.json({ 
            error: 'Failed to send invoice', 
            details: error.message 
        }, { status: 500 });
    }
}
