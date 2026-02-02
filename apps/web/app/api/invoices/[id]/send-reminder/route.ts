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

    // Get invoice details
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

    // Don't send reminder for paid invoices
    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 })
    }

    // Get recipient details
    let recipientEmail = ''
    let recipientName = ''

    if (invoice.entity_type === 'VENDOR') {
      const vendors = await prisma.$queryRawUnsafe<any[]>(`
        SELECT contact_email, contact_name, name
        FROM event_vendors
        WHERE id = $1
        LIMIT 1
      `, invoice.entity_id)
      const vendor = vendors[0]
      recipientEmail = vendor?.contact_email
      recipientName = vendor?.contact_name || vendor?.name
    } else if (invoice.entity_type === 'SPONSOR') {
      const sponsors = await prisma.$queryRawUnsafe<any[]>(`
        SELECT contact_email, contact_name, name
        FROM sponsors
        WHERE id = $1
        LIMIT 1
      `, invoice.entity_id)
      const sponsor = sponsors[0]
      recipientEmail = sponsor?.contact_email
      recipientName = sponsor?.contact_name || sponsor?.name
    } else if (invoice.entity_type === 'EXHIBITOR') {
      const exhibitors = await prisma.$queryRawUnsafe<any[]>(`
        SELECT contact_email, contact_name, name
        FROM exhibitor_registrations
        WHERE id = $1
        LIMIT 1
      `, invoice.entity_id)
      const exhibitor = exhibitors[0]
      recipientEmail = exhibitor?.contact_email
      recipientName = exhibitor?.contact_name || exhibitor?.name
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Recipient email not found' }, { status: 400 })
    }

    // Calculate days overdue
    const dueDate = invoice.due_date ? new Date(invoice.due_date) : null
    const today = new Date()
    const daysOverdue = dueDate ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
    const isOverdue = daysOverdue > 0

    // Generate payment link
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoiceId}`

    // Send reminder email
    const emailSubject = isOverdue 
      ? `Payment Reminder - Invoice ${invoice.invoice_number} (${daysOverdue} days overdue)`
      : `Payment Reminder - Invoice ${invoice.invoice_number}`

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        ${isOverdue ? `
          <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <h3 style="color: #991b1b; margin: 0 0 5px 0;">⚠️ Payment Overdue</h3>
            <p style="color: #7f1d1d; margin: 0;">This invoice is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue.</p>
          </div>
        ` : ''}

        <h2 style="color: #1a1a1a;">Payment Reminder</h2>
        <p>Dear ${recipientName},</p>
        <p>This is a friendly reminder about your pending payment for <strong>${invoice.event_name || 'your service'}</strong>.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Invoice Details</h3>
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Amount Due:</strong> ₹${Number(invoice.total).toLocaleString()}</p>
          <p><strong>Due Date:</strong> ${dueDate ? dueDate.toLocaleDateString() : 'N/A'}</p>
          ${isOverdue ? `<p style="color: #ef4444;"><strong>Days Overdue:</strong> ${daysOverdue}</p>` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" 
             style="background: ${isOverdue ? '#ef4444' : '#3b82f6'}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            ${isOverdue ? 'Pay Now (Overdue)' : 'Pay Now'}
          </a>
        </div>

        <p style="color: #666; font-size: 14px;">
          If you have already made the payment, please disregard this reminder. For any questions, contact us at billing@ayphen.com
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

    // Update invoice status to OVERDUE if past due date
    if (isOverdue && invoice.status !== 'OVERDUE') {
      await prisma.$executeRawUnsafe(`
        UPDATE invoices 
        SET status = 'OVERDUE', updated_at = NOW()
        WHERE id = $1
      `, invoiceId)
    }

    // Log the reminder
    await prisma.$executeRawUnsafe(`
      INSERT INTO invoice_activity_log (
        id, invoice_id, action, details, created_at
      ) VALUES (
        gen_random_uuid(), $1, 'REMINDER_SENT', $2, NOW()
      )
    `, invoiceId, JSON.stringify({ 
      email: recipientEmail, 
      daysOverdue: isOverdue ? daysOverdue : 0 
    })).catch(() => {
      console.log('Activity log table may not exist')
    })

    return NextResponse.json({
      success: true,
      message: 'Payment reminder sent successfully',
      sentTo: recipientEmail,
      isOverdue,
      daysOverdue: isOverdue ? daysOverdue : 0
    })

  } catch (error: any) {
    console.error('Send reminder error:', error)
    return NextResponse.json({
      error: 'Failed to send reminder',
      details: error.message
    }, { status: 500 })
  }
}
