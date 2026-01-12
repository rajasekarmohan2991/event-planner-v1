import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const params = 'then' in context.params ? await context.params : context.params
    const invoiceId = params.id

    // Get invoice details using raw SQL
    const invoices = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        i.id, i.invoice_number, i.entity_type, i.entity_id, i.event_id,
        i.amount, i.tax, i.total, i.status, i.invoice_date, i.due_date,
        e.name as event_name
      FROM invoices i
      LEFT JOIN events e ON i.event_id = e.id::text
      WHERE i.id = $1
      LIMIT 1
    `, invoiceId)

    if (invoices.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const invoice = invoices[0]

    // Get recipient details based on entity type
    let recipientEmail = ''
    let recipientName = ''
    let entityDetails: any = null

    if (invoice.entity_type === 'VENDOR') {
      const vendors = await prisma.$queryRawUnsafe<any[]>(`
        SELECT contact_email, contact_name, name
        FROM event_vendors
        WHERE id = $1
        LIMIT 1
      `, invoice.entity_id)
      entityDetails = vendors[0]
      recipientEmail = entityDetails?.contact_email
      recipientName = entityDetails?.contact_name || entityDetails?.name
    } else if (invoice.entity_type === 'SPONSOR') {
      const sponsors = await prisma.$queryRawUnsafe<any[]>(`
        SELECT contact_email, contact_name, name
        FROM sponsors
        WHERE id = $1
        LIMIT 1
      `, invoice.entity_id)
      entityDetails = sponsors[0]
      recipientEmail = entityDetails?.contact_email
      recipientName = entityDetails?.contact_name || entityDetails?.name
    } else if (invoice.entity_type === 'EXHIBITOR') {
      const exhibitors = await prisma.$queryRawUnsafe<any[]>(`
        SELECT contact_email, contact_name, name
        FROM exhibitor_registrations
        WHERE id = $1
        LIMIT 1
      `, invoice.entity_id)
      entityDetails = exhibitors[0]
      recipientEmail = entityDetails?.contact_email
      recipientName = entityDetails?.contact_name || entityDetails?.name
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Recipient email not found' }, { status: 400 })
    }

    // Generate payment link
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoiceId}`

    // Send email with payment link
    const emailSubject = `Payment Request - Invoice ${invoice.invoice_number}`
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Payment Request</h2>
        <p>Dear ${recipientName},</p>
        <p>This is a payment request for <strong>${invoice.event_name || 'your service'}</strong>.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Invoice Details</h3>
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Amount:</strong> ₹${Number(invoice.total).toLocaleString()}</p>
          <p><strong>Due Date:</strong> ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Status:</strong> ${invoice.status}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" 
             style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Pay Now
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          If you have any questions, please contact us at billing@ayphen.com
        </p>

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          Ayphen Event Planner | Professional Event Management
        </p>
      </div>
    `

    await sendEmail({
      to: recipientEmail,
      subject: emailSubject,
      html: emailBody
    })

    // Update invoice status to SENT if it was DRAFT
    if (invoice.status === 'DRAFT' || invoice.status === 'PENDING') {
      await prisma.$executeRawUnsafe(`
        UPDATE invoices 
        SET status = 'SENT', updated_at = NOW()
        WHERE id = $1
      `, invoiceId)
    }

    // Log the payment link send
    await prisma.$executeRawUnsafe(`
      INSERT INTO invoice_activity_log (
        id, invoice_id, action, details, created_at
      ) VALUES (
        gen_random_uuid(), $1, 'PAYMENT_LINK_SENT', $2, NOW()
      )
    `, invoiceId, JSON.stringify({ email: recipientEmail, link: paymentLink })).catch(() => {
      console.log('Activity log table may not exist')
    })

    return NextResponse.json({
      success: true,
      message: 'Payment link sent successfully',
      sentTo: recipientEmail,
      paymentLink
    })

  } catch (error: any) {
    console.error('Send payment link error:', error)
    return NextResponse.json({
      error: 'Failed to send payment link',
      details: error.message
    }, { status: 500 })
  }
}
