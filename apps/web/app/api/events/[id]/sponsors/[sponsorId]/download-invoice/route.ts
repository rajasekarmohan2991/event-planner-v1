import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateInvoiceNumber, generateInvoiceHTML, InvoiceData } from '@/lib/invoice-generator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string; sponsorId: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {
        const eventId = BigInt(params.id)
        const sponsorId = params.sponsorId

        // Get sponsor details
        const sponsors = await prisma.$queryRaw<any[]>`
            SELECT 
                id, event_id, name, tier, 
                contact_data, payment_data,
                created_at
            FROM sponsors
            WHERE id = ${sponsorId} AND event_id = ${eventId}
            LIMIT 1
        `

        if (!sponsors || sponsors.length === 0) {
            return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })
        }

        const sponsor = sponsors[0]

        // Get event details
        const events = await prisma.$queryRaw<any[]>`
            SELECT id, name, starts_at, venue, address
            FROM events
            WHERE id = ${eventId}
            LIMIT 1
        `

        if (!events || events.length === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        const event = events[0]

        // Parse JSON data
        const paymentData = typeof sponsor.payment_data === 'string'
            ? JSON.parse(sponsor.payment_data)
            : (sponsor.payment_data || {})

        const contactData = typeof sponsor.contact_data === 'string'
            ? JSON.parse(sponsor.contact_data)
            : (sponsor.contact_data || {})

        // Calculate amounts
        const totalAmount = Number(paymentData.amount || 0)
        // Assume simplified tax calculation (inclusive or exclusive logic similar to exhibitors)
        // For consistency with exhibitors: subtotal = total / 1.18
        const subtotal = totalAmount / 1.18
        const tax = totalAmount - subtotal
        const taxRate = 18

        // Generate invoice number
        const invoiceNumber = generateInvoiceNumber('SPONSOR', params.id)

        // Prepare invoice data
        const invoiceData: InvoiceData = {
            invoiceNumber,
            invoiceDate: new Date(),
            dueDate: paymentData.status === 'PAID' ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

            payerName: contactData.name || sponsor.name,
            payerEmail: contactData.email || '',
            payerPhone: contactData.phone || '',
            payerCompany: sponsor.name,

            eventId: params.id,
            eventName: event.name,
            eventDate: event.starts_at ? new Date(event.starts_at) : undefined,

            type: 'SPONSOR',
            description: `Sponsorship - ${event.name}`,
            items: [
                {
                    description: `Sponsorship Package - ${sponsor.tier || 'Custom'}`,
                    quantity: 1,
                    unitPrice: subtotal,
                    amount: subtotal
                }
            ],

            subtotal,
            tax,
            taxRate,
            total: totalAmount,

            paymentMethod: paymentData.method,
            paymentReference: paymentData.reference,
            paymentDate: paymentData.paidAt ? new Date(paymentData.paidAt) : undefined,
            paymentStatus: paymentData.status === 'PAID' ? 'PAID' : 'PENDING',

            bankDetails: paymentData.status !== 'PAID' ? {
                bankName: 'HDFC Bank',
                accountNumber: '50200012345678',
                ifscCode: 'HDFC0001234',
                accountHolderName: 'Ayphen Event Planner Pvt Ltd',
                upiId: 'ayphen@hdfcbank'
            } : undefined,

            notes: `Thank you for sponsoring ${event.name}!`
        }

        // Generate HTML
        const invoiceHTML = generateInvoiceHTML(invoiceData)

        // Add print button and auto-print script for better UX (Browser-based PDF generation)
        const printableHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #4F46E5;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 1000;
    }
    .print-button:hover {
      background: #4338CA;
    }
    @media print {
      .print-button {
        display: none !important;
      }
      @page {
        size: A4;
        margin: 0;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">
    🖨️ Print / Save as PDF
  </button>
  ${invoiceHTML.split('<body>')[1]?.split('</body>')[0] || invoiceHTML}
  <script>
    // Auto-open print dialog after page loads
    window.addEventListener('load', function() {
      setTimeout(function() {
        // Uncomment to auto-print on load
        // window.print();
      }, 500);
    });
  </script>
</body>
</html>
    `

        // Return HTML with proper headers
        return new NextResponse(printableHTML, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
        })

    } catch (error: any) {
        console.error('Sponsor Invoice Download Error:', error)
        return NextResponse.json({
            error: 'Failed to generate invoice',
            details: error.message
        }, { status: 500 })
    }
}
