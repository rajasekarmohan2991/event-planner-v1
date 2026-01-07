import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateInvoiceNumber, generateInvoiceHTML, InvoiceData } from '@/lib/invoice-generator'
import { generatePDFFromHTML, generatePDFFilename, createPDFHeaders } from '@/lib/pdf-generator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {
        const eventId = BigInt(params.id)
        const exhibitorId = params.exhibitorId

        // Get exhibitor details
        const exhibitors = await prisma.$queryRaw<any[]>`
      SELECT 
        id, event_id, name, company_name, contact_name, contact_email, contact_phone,
        booth_size, booth_type, booth_number, booth_area,
        payment_amount, payment_method, payment_status, payment_reference,
        paid_at, created_at
      FROM exhibitor_registrations
      WHERE id = ${exhibitorId} AND event_id = ${eventId}
      LIMIT 1
    `

        if (exhibitors.length === 0) {
            return NextResponse.json({ error: 'Exhibitor not found' }, { status: 404 })
        }

        const exhibitor = exhibitors[0]

        // Get event details
        const events = await prisma.$queryRaw<any[]>`
      SELECT id, name, starts_at, venue, address
      FROM events
      WHERE id = ${eventId}
      LIMIT 1
    `

        if (events.length === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        const event = events[0]

        // Calculate amounts
        const totalAmount = exhibitor.payment_amount || 0
        const subtotal = totalAmount / 1.18 // Remove GST to get base
        const tax = totalAmount - subtotal
        const taxRate = 18

        // Generate invoice number
        const invoiceNumber = generateInvoiceNumber('EXHIBITOR', params.id)

        // Prepare invoice data
        const invoiceData: InvoiceData = {
            invoiceNumber,
            invoiceDate: new Date(),
            dueDate: exhibitor.payment_status === 'PAID' ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

            payerName: exhibitor.contact_name || exhibitor.name,
            payerEmail: exhibitor.contact_email,
            payerPhone: exhibitor.contact_phone,
            payerCompany: exhibitor.company_name || exhibitor.name,

            eventId: params.id,
            eventName: event.name,
            eventDate: event.starts_at ? new Date(event.starts_at) : undefined,

            type: 'EXHIBITOR',
            description: `Exhibitor Registration - ${event.name}`,
            items: [
                {
                    description: `Booth Registration - ${exhibitor.booth_type || 'Standard'} (${exhibitor.booth_size || exhibitor.booth_area || 'TBD'})`,
                    quantity: 1,
                    unitPrice: subtotal,
                    amount: subtotal
                }
            ],

            subtotal,
            tax,
            taxRate,
            total: totalAmount,

            paymentMethod: exhibitor.payment_method,
            paymentReference: exhibitor.payment_reference,
            paymentDate: exhibitor.paid_at ? new Date(exhibitor.paid_at) : undefined,
            paymentStatus: exhibitor.payment_status === 'PAID' ? 'PAID' : 'PENDING',

            bankDetails: exhibitor.payment_status !== 'PAID' ? {
                bankName: 'HDFC Bank',
                accountNumber: '50200012345678',
                ifscCode: 'HDFC0001234',
                accountHolderName: 'Ayphen Event Planner Pvt Ltd',
                upiId: 'ayphen@hdfcbank'
            } : undefined,

            notes: exhibitor.booth_number
                ? `Your booth number is ${exhibitor.booth_number}. Please arrive at least 1 hour early for setup.`
                : 'Booth number will be assigned after payment confirmation.'
        }

        // Generate HTML
        const invoiceHTML = generateInvoiceHTML(invoiceData)

        // Generate PDF
        const pdfBuffer = await generatePDFFromHTML(invoiceHTML)

        // Generate filename
        const filename = generatePDFFilename(
            'Invoice',
            invoiceNumber,
            exhibitor.company_name || exhibitor.name
        )

        // Return PDF with proper headers
        return new NextResponse(pdfBuffer, {
            headers: createPDFHeaders(filename)
        })

    } catch (error: any) {
        console.error('PDF download error:', error)
        return NextResponse.json({
            error: 'Failed to generate PDF',
            details: error.message
        }, { status: 500 })
    }
}
