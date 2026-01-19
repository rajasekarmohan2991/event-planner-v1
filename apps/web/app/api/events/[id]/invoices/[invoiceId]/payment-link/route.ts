import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/invoices/[invoiceId]/payment-link - Generate payment link
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string; invoiceId: string } }
) {
    try {
        const { invoiceId } = params

        // Fetch invoice
        const invoiceData = await prisma.$queryRaw<any[]>`
            SELECT 
                id,
                invoice_number,
                total_amount,
                status,
                payer_email,
                payer_name
            FROM invoices
            WHERE id = ${invoiceId}
            LIMIT 1
        `

        if (!invoiceData || invoiceData.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        const invoice = invoiceData[0]

        if (invoice.status === 'PAID') {
            return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
        }

        // Generate secure payment token
        const paymentToken = crypto.randomBytes(32).toString('hex')

        // Store payment token (expires in 7 days)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        await prisma.$executeRaw`
            UPDATE invoices
            SET payment_token = ${paymentToken},
                payment_token_expires = ${expiresAt}
            WHERE id = ${invoiceId}
        `

        // Generate payment link
        const paymentLink = `${process.env.NEXTAUTH_URL}/invoices/${invoiceId}/pay?token=${paymentToken}`

        return NextResponse.json({
            success: true,
            paymentLink,
            invoiceNumber: invoice.invoice_number,
            amount: Number(invoice.total_amount),
            expiresAt
        })

    } catch (error: any) {
        console.error('Failed to generate payment link:', error)
        return NextResponse.json({
            error: 'Failed to generate payment link',
            details: error.message
        }, { status: 500 })
    }
}

// POST /api/events/[id]/invoices/[invoiceId]/payment-link - Send payment link via email
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string; invoiceId: string } }
) {
    try {
        const { invoiceId } = params

        // Fetch invoice
        const invoiceData = await prisma.$queryRaw<any[]>`
            SELECT 
                i.id,
                i.invoice_number,
                i.total_amount,
                i.status,
                i.payer_email,
                i.payer_name,
                e.name as event_name
            FROM invoices i
            JOIN events e ON i.event_id = e.id::text
            WHERE i.id = ${invoiceId}
            LIMIT 1
        `

        if (!invoiceData || invoiceData.length === 0) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        const invoice = invoiceData[0]

        if (invoice.status === 'PAID') {
            return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
        }

        // Generate secure payment token
        const paymentToken = crypto.randomBytes(32).toString('hex')

        // Store payment token (expires in 7 days)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        await prisma.$executeRaw`
            UPDATE invoices
            SET payment_token = ${paymentToken},
                payment_token_expires = ${expiresAt}
            WHERE id = ${invoiceId}
        `

        // Generate payment link
        const paymentLink = `${process.env.NEXTAUTH_URL}/invoices/${invoiceId}/pay?token=${paymentToken}`

        // Send email with payment link
        const { sendEmail } = await import('@/lib/email')

        await sendEmail({
            to: invoice.payer_email,
            subject: `Payment Request - Invoice ${invoice.invoice_number}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .amount { font-size: 32px; font-weight: bold; color: #1a1a1a; margin: 20px 0; }
                        .button { display: inline-block; padding: 15px 30px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                        .button:hover { background: #059669; }
                        .info { background: white; padding: 15px; border-left: 4px solid #10B981; margin: 20px 0; }
                        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Payment Request</h1>
                            <p>Invoice ${invoice.invoice_number}</p>
                        </div>
                        <div class="content">
                            <p>Dear ${invoice.payer_name},</p>
                            <p>You have a pending payment for <strong>${invoice.event_name}</strong>.</p>
                            
                            <div class="info">
                                <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
                                <p><strong>Amount Due:</strong></p>
                                <div class="amount">₹${Number(invoice.total_amount).toLocaleString()}</div>
                            </div>

                            <p>Click the button below to make a secure payment:</p>
                            <div style="text-align: center;">
                                <a href="${paymentLink}" class="button">Pay Now</a>
                            </div>

                            <p style="font-size: 12px; color: #666; margin-top: 20px;">
                                This payment link will expire on ${expiresAt.toLocaleDateString()}.
                            </p>

                            <div class="footer">
                                <p>If you have any questions, please contact us at billing@ayphen.com</p>
                                <p>© 2025 Ayphen Event Planner. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Payment Request - Invoice ${invoice.invoice_number}

Dear ${invoice.payer_name},

You have a pending payment for ${invoice.event_name}.

Invoice Number: ${invoice.invoice_number}
Amount Due: ₹${Number(invoice.total_amount).toLocaleString()}

Pay online: ${paymentLink}

This payment link will expire on ${expiresAt.toLocaleDateString()}.

If you have any questions, please contact us at billing@ayphen.com
            `.trim()
        })

        return NextResponse.json({
            success: true,
            message: 'Payment link sent successfully',
            paymentLink,
            sentTo: invoice.payer_email
        })

    } catch (error: any) {
        console.error('Failed to send payment link:', error)
        return NextResponse.json({
            error: 'Failed to send payment link',
            details: error.message
        }, { status: 500 })
    }
}
