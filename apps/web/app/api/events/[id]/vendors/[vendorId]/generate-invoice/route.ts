import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateInvoiceNumber, sendInvoiceEmail, InvoiceData } from '@/lib/invoice-generator'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string; vendorId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const eventId = params.id

    // Get vendor details using raw SQL
    const vendors = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id, event_id, name, category, 
        contact_name, contact_email, contact_phone,
        contract_amount, paid_amount, payment_status,
        bank_name, account_number, ifsc_code, account_holder_name, upi_id
      FROM event_vendors
      WHERE id = $1 AND event_id = $2
      LIMIT 1
    `, params.vendorId, eventId)

    if (vendors.length === 0) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const vendor = vendors[0]

    // Get event details
    const events = await prisma.$queryRaw<any[]>`
      SELECT id, name, starts_at
      FROM events
      WHERE id = ${BigInt(eventId)}
      LIMIT 1
    `

    if (events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = events[0]

    // Calculate amounts
    const totalAmount = vendor.contract_amount || 0
    const subtotal = totalAmount / 1.18
    const tax = totalAmount - subtotal
    const taxRate = 18

    const invoiceNumber = generateInvoiceNumber('VENDOR', eventId)

    const invoiceData: InvoiceData = {
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate: vendor.payment_status === 'PAID' ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      
      payerName: vendor.contact_name || vendor.name,
      payerEmail: vendor.contact_email || '',
      payerPhone: vendor.contact_phone || undefined,
      payerCompany: vendor.name,
      
      eventId: eventId,
      eventName: event.name,
      eventDate: event.starts_at ? new Date(event.starts_at) : undefined,
      
      type: 'VENDOR',
      description: `Vendor Services - ${event.name}`,
      items: [
        {
          description: `${vendor.category || 'General'} Services`,
          quantity: 1,
          unitPrice: subtotal,
          amount: subtotal
        }
      ],
      
      subtotal,
      tax,
      taxRate,
      total: totalAmount,
      
      paymentStatus: vendor.payment_status === 'PAID' ? 'PAID' : 'PENDING',
      
      bankDetails: vendor.payment_status !== 'PAID' && vendor.bank_name ? {
        bankName: vendor.bank_name,
        accountNumber: vendor.account_number,
        ifscCode: vendor.ifsc_code,
        accountHolderName: vendor.account_holder_name,
        upiId: vendor.upi_id
      } : undefined,
      
      notes: `Payment for ${vendor.category || 'vendor'} services provided for ${event.name}.`
    }

    const sent = await sendInvoiceEmail(invoiceData)

    if (sent) {
      await prisma.$executeRaw`
        INSERT INTO invoices (
          id, invoice_number, entity_type, entity_id, event_id,
          amount, tax, total, status, invoice_date, created_at
        ) VALUES (
          gen_random_uuid(), ${invoiceNumber}, 'VENDOR', ${params.vendorId}, ${eventId},
          ${subtotal}, ${tax}, ${totalAmount}, ${invoiceData.paymentStatus}, NOW(), NOW()
        )
        ON CONFLICT (invoice_number) DO NOTHING
      `.catch(() => console.log('Invoice table may not exist'))

      return NextResponse.json({
        success: true,
        message: 'Invoice generated and sent successfully',
        invoiceNumber,
        sentTo: vendor.contact_email
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send invoice email'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Vendor invoice generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate invoice',
      details: error.message 
    }, { status: 500 })
  }
}
