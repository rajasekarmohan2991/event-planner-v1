import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateInvoiceNumber, generateInvoiceHTML, InvoiceData } from '@/lib/invoice-generator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string; vendorId: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {
        const eventId = params.id
        const vendorId = params.vendorId

        // Get vendor details using raw query to match existing vendor API pattern
        const vendors = await prisma.$queryRawUnsafe(`
            SELECT 
                id, event_id, name, category, 
                contact_name as "contactName", contact_email as "contactEmail", contact_phone as "contactPhone",
                contract_amount as "contractAmount", paid_amount as "paidAmount",
                payment_status as "paymentStatus", payment_due_date as "paymentDueDate",
                created_at
            FROM event_vendors
            WHERE id = $1 AND event_id = $2
            LIMIT 1
        `, vendorId, eventId) as any[]

        if (!vendors || vendors.length === 0) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
        }

        const vendor = vendors[0]

        // Get event details
        const events = await prisma.$queryRaw<any[]>`
            SELECT id, name, starts_at, venue, address
            FROM events
            WHERE id = ${BigInt(eventId)}
            LIMIT 1
        `

        if (!events || events.length === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        const event = events[0]

        // Calculate amounts
        const totalAmount = Number(vendor.contractAmount || 0)
        // Assume simplified tax calculation 
        const subtotal = totalAmount / 1.18
        const tax = totalAmount - subtotal
        const taxRate = 18

        // Generate invoice number
        const invoiceNumber = generateInvoiceNumber('VENDOR', params.id)

        // Prepare invoice data
        const invoiceData: InvoiceData = {
            invoiceNumber,
            invoiceDate: new Date(),
            dueDate: vendor.paymentDueDate ? new Date(vendor.paymentDueDate) : undefined,

            payerName: vendor.contactName || vendor.name,
            payerEmail: vendor.contactEmail || '',
            payerPhone: vendor.contactPhone || '',
            payerCompany: vendor.name,

            eventId: params.id,
            eventName: event.name,
            eventDate: event.starts_at ? new Date(event.starts_at) : undefined,

            type: 'VENDOR',
            description: `Vendor Services - ${event.name}`,
            items: [
                {
                    description: `Service Contract - ${vendor.category || 'General'}`,
                    quantity: 1,
                    unitPrice: subtotal,
                    amount: subtotal
                }
            ],

            subtotal,
            tax,
            taxRate,
            total: totalAmount,

            paymentStatus: vendor.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
            paymentDate: vendor.paymentStatus === 'PAID' ? new Date() : undefined, // We don't have paid_at in query, fallback to now if paid

            bankDetails: vendor.paymentStatus !== 'PAID' ? {
                bankName: 'HDFC Bank',
                accountNumber: '50200012345678',
                ifscCode: 'HDFC0001234',
                accountHolderName: 'Ayphen Event Planner Pvt Ltd',
                upiId: 'ayphen@hdfcbank'
            } : undefined,

            notes: `Contract for ${vendor.category} services.`
        }

        // Generate HTML
        const invoiceHTML = generateInvoiceHTML(invoiceData)

        // Add print button and auto-print script for better UX
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

        return new NextResponse(printableHTML, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            }
        })

    } catch (error: any) {
        console.error('Vendor Invoice Download Error:', error)
        return NextResponse.json({
            error: 'Failed to generate invoice',
            details: error.message
        }, { status: 500 })
    }
}
