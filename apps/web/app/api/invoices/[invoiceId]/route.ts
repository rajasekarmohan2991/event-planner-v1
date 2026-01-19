import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/invoices/[invoiceId] - Get invoice details (public with token)
export async function GET(
    req: NextRequest,
    { params }: { params: { invoiceId: string } }
) {
    try {
        const { invoiceId } = params
        const { searchParams } = new URL(req.url)
        const token = searchParams.get('token')

        // Fetch invoice
        const invoiceData = await prisma.$queryRaw<any[]>`
            SELECT 
                i.id,
                i.invoice_number,
                i.event_id,
                i.type,
                i.payer_name,
                i.payer_email,
                i.payer_phone,
                i.payer_company,
                i.payer_address,
                i.subtotal,
                i.tax_rate,
                i.tax_amount,
                i.total_amount,
                i.status,
                i.invoice_date,
                i.due_date,
                i.payment_date,
                i.payment_method,
                i.payment_reference,
                i.payment_token,
                i.payment_token_expires,
                i.notes,
                e.name as event_name,
                e.starts_at as event_date
            FROM invoices i
            JOIN events e ON i.event_id = e.id::text
            WHERE i.id = ${invoiceId}
            LIMIT 1
        `

        if (!invoiceData || invoiceData.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        const invoice = invoiceData[0]

        // Verify token if invoice is not paid
        if (invoice.status !== 'PAID' && token) {
            if (invoice.payment_token !== token) {
                return NextResponse.json({ error: 'Invalid payment token' }, { status: 403 })
            }

            if (invoice.payment_token_expires && new Date(invoice.payment_token_expires) < new Date()) {
                return NextResponse.json({ error: 'Payment link expired' }, { status: 403 })
            }
        }

        // Fetch line items
        const lineItems = await prisma.$queryRaw<any[]>`
            SELECT description, quantity, unit_price, amount
            FROM invoice_line_items
            WHERE invoice_id = ${invoiceId}
            ORDER BY id
        `

        return NextResponse.json({
            invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoice_number,
                eventId: invoice.event_id,
                eventName: invoice.event_name,
                eventDate: invoice.event_date,
                type: invoice.type,
                payerName: invoice.payer_name,
                payerEmail: invoice.payer_email,
                payerPhone: invoice.payer_phone,
                payerCompany: invoice.payer_company,
                payerAddress: invoice.payer_address,
                items: lineItems.map(item => ({
                    description: item.description,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unit_price),
                    amount: Number(item.amount)
                })),
                subtotal: Number(invoice.subtotal),
                taxRate: Number(invoice.tax_rate),
                tax: Number(invoice.tax_amount),
                total: Number(invoice.total_amount),
                status: invoice.status,
                invoiceDate: invoice.invoice_date,
                dueDate: invoice.due_date,
                paymentDate: invoice.payment_date,
                paymentMethod: invoice.payment_method,
                paymentReference: invoice.payment_reference,
                notes: invoice.notes
            }
        })

    } catch (error: any) {
        console.error('Failed to fetch invoice:', error)
        return NextResponse.json({
            error: 'Failed to fetch invoice',
            details: error.message
        }, { status: 500 })
    }
}
