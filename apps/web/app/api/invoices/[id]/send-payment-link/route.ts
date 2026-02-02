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

    // Get invoice details using raw SQL with new schema
    const invoices = await prisma.$queryRaw<any[]>`
      SELECT 
        i.id, i.number, i.recipient_type, i.recipient_name, i.recipient_email,
        i.grand_total, i.status, i.date, i.due_date, i.event_id,
        e.name as event_name
      FROM invoices i
      LEFT JOIN events e ON i.event_id = e.id
      WHERE i.id = ${invoiceId}
      LIMIT 1
    `;

    if (invoices.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const invoice = invoices[0]
    const recipientEmail = invoice.recipient_email
    const recipientName = invoice.recipient_name

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Recipient email not found' }, { status: 400 })
    }

    // Generate payment link
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoiceId}`

    // Send email with payment link
    const emailSubject = `Payment Request - Invoice ${invoice.number}`
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Payment Request</h2>
        <p>Dear ${recipientName},</p>
        <p>This is a payment request for <strong>${invoice.event_name || 'your service'}</strong>.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Invoice Details</h3>
          <p><strong>Invoice Number:</strong> ${invoice.number}</p>
          <p><strong>Amount:</strong> ₹${Number(invoice.grand_total).toLocaleString()}</p>
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
      await prisma.$executeRaw`
        UPDATE invoices 
        SET status = 'SENT', updated_at = NOW()
        WHERE id = ${invoiceId}
      `
    }

    // Log the payment link send (optional - table may not exist)
    try {
      await prisma.$executeRaw`
        INSERT INTO invoice_activity_log (
          id, invoice_id, action, details, created_at
        ) VALUES (
          gen_random_uuid(), ${invoiceId}, 'PAYMENT_LINK_SENT', ${JSON.stringify({ email: recipientEmail, link: paymentLink })}, NOW()
        )
      `
    } catch (logError) {
      console.log('Activity log table may not exist, skipping log')
    }

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
