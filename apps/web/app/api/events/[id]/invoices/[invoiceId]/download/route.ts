import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateInvoiceHTML, type InvoiceData } from '@/lib/invoice-generator'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/invoices/[invoiceId]/download - Download invoice as HTML
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string; invoiceId: string } }
) {
    try {
        const { invoiceId } = params

        // Fetch invoice with line items
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

        // Fetch line items
        const lineItems = await prisma.$queryRaw<any[]>`
            SELECT description, quantity, unit_price, amount
            FROM invoice_line_items
            WHERE invoice_id = ${invoiceId}
            ORDER BY id
        `

        // Prepare invoice data
        const data: InvoiceData = {
            invoiceNumber: invoice.invoice_number,
            invoiceDate: new Date(invoice.invoice_date),
            dueDate: invoice.due_date ? new Date(invoice.due_date) : undefined,
            payerName: invoice.payer_name,
            payerEmail: invoice.payer_email,
            payerPhone: invoice.payer_phone,
            payerCompany: invoice.payer_company,
            payerAddress: invoice.payer_address,
            eventId: invoice.event_id,
            eventName: invoice.event_name,
            eventDate: invoice.event_date ? new Date(invoice.event_date) : undefined,
            type: invoice.type,
            description: `${invoice.type} Invoice`,
            items: lineItems.map(item => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unit_price),
                amount: Number(item.amount)
            })),
            subtotal: Number(invoice.subtotal),
            tax: Number(invoice.tax_amount),
            taxRate: Number(invoice.tax_rate),
            total: Number(invoice.total_amount),
            paymentStatus: invoice.status,
            paymentMethod: invoice.payment_method,
            paymentReference: invoice.payment_reference,
            paymentDate: invoice.payment_date ? new Date(invoice.payment_date) : undefined,
            notes: invoice.notes
        }

        // Generate HTML
        const html = generateInvoiceHTML(data)

        // Return HTML with proper headers for download
        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `attachment; filename="Invoice-${invoice.invoice_number}.html"`
            }
        })

    } catch (error: any) {
        console.error('Failed to download invoice:', error)
        return NextResponse.json({
            error: 'Failed to download invoice',
            details: error.message
        }, { status: 500 })
    }
}
