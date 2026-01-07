import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateInvoiceNumber, sendInvoiceEmail, InvoiceData } from '@/lib/invoice-generator'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string; sponsorId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const eventId = BigInt(params.id)

    // Get sponsor details using raw SQL
    const sponsors = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id, event_id, name, tier, amount,
        contact_name, contact_email, contact_phone,
        payment_status, payment_method, payment_reference, paid_at
      FROM sponsors
      WHERE id = $1 AND event_id = $2
      LIMIT 1
    `, params.sponsorId, eventId.toString())

    if (sponsors.length === 0) {
      return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })
    }

    const sponsor = sponsors[0]

    // Get event details
    const events = await prisma.$queryRaw<any[]>`
      SELECT id, name, starts_at
      FROM events
      WHERE id = ${eventId}
      LIMIT 1
    `

    if (events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = events[0]

    // Calculate amounts
    const totalAmount = sponsor.amount || 0
    const subtotal = totalAmount / 1.18
    const tax = totalAmount - subtotal
    const taxRate = 18

    const invoiceNumber = generateInvoiceNumber('SPONSOR', params.id)

    const invoiceData: InvoiceData = {
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate: sponsor.payment_status === 'PAID' ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      
      payerName: sponsor.contact_name || sponsor.name,
      payerEmail: sponsor.contact_email || '',
      payerPhone: sponsor.contact_phone || undefined,
      payerCompany: sponsor.name,
      
      eventId: params.id,
      eventName: event.name,
      eventDate: event.starts_at ? new Date(event.starts_at) : undefined,
      
      type: 'SPONSOR',
      description: `Sponsorship - ${event.name}`,
      items: [
        {
          description: `${sponsor.tier || 'Standard'} Sponsorship Package`,
          quantity: 1,
          unitPrice: subtotal,
          amount: subtotal
        }
      ],
      
      subtotal,
      tax,
      taxRate,
      total: totalAmount,
      
      paymentMethod: sponsor.payment_method || undefined,
      paymentReference: sponsor.payment_reference || undefined,
      paymentDate: sponsor.paid_at ? new Date(sponsor.paid_at) : undefined,
      paymentStatus: sponsor.payment_status === 'PAID' ? 'PAID' : 'PENDING',
      
      bankDetails: sponsor.payment_status !== 'PAID' ? {
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Ayphen Event Planner Pvt Ltd',
        upiId: 'ayphen@hdfcbank'
      } : undefined,
      
      notes: `Thank you for sponsoring ${event.name}. Your logo and branding will be prominently displayed at the event.`
    }

    const sent = await sendInvoiceEmail(invoiceData)

    if (sent) {
      await prisma.$executeRaw`
        INSERT INTO invoices (
          id, invoice_number, entity_type, entity_id, event_id,
          amount, tax, total, status, invoice_date, created_at
        ) VALUES (
          gen_random_uuid(), ${invoiceNumber}, 'SPONSOR', ${params.sponsorId}, ${eventId.toString()},
          ${subtotal}, ${tax}, ${totalAmount}, ${invoiceData.paymentStatus}, NOW(), NOW()
        )
        ON CONFLICT (invoice_number) DO NOTHING
      `.catch(() => console.log('Invoice table may not exist'))

      return NextResponse.json({
        success: true,
        message: 'Invoice generated and sent successfully',
        invoiceNumber,
        sentTo: sponsor.contact_email
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send invoice email'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Sponsor invoice generation error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate invoice',
      details: error.message 
    }, { status: 500 })
  }
}
