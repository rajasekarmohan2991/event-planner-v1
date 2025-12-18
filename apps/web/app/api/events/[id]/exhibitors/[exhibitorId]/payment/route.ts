import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const permError = await checkPermissionInRoute('events.manage_registrations', 'Confirm Payment')
    if (permError) return permError

    try {
        const body = await req.json()
        const { paymentMethod, paymentReference, amount } = body
        const userId = (session as any)?.user?.id

        const exhibitor = await prisma.exhibitor.findUnique({
            where: { id: params.exhibitorId }
        })

        if (!exhibitor) {
            return NextResponse.json({ message: 'Exhibitor not found' }, { status: 404 })
        }

        if (!exhibitor.adminApproved) {
            return NextResponse.json({ message: 'Exhibitor must be approved first' }, { status: 400 })
        }

        // Update payment status
        const updated = await prisma.exhibitor.update({
            where: { id: params.exhibitorId },
            data: {
                paymentStatus: 'COMPLETED',
                paymentMethod: paymentMethod || 'BANK_TRANSFER',
                paymentReference: paymentReference,
                paymentAmount: amount || exhibitor.paymentAmount,
                paidAt: new Date(),
                status: 'PAYMENT_COMPLETED'
            }
        })

        // Fetch event details
        const event = await prisma.event.findUnique({
            where: { id: BigInt(params.id) },
            select: { name: true }
        })
        const eventName = event?.name || `Event #${params.id}`

        // Send payment confirmation email
        const to = exhibitor.contactEmail || ''
        if (to) {
            sendEmail({
                to,
                subject: `Payment Confirmed - ${eventName}`,
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2d2d2d; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💳 Payment Confirmed!</h1>
                <p>Exhibitor Registration for ${eventName}</p>
              </div>
              <div class="content">
                <p>Hi <strong>${exhibitor.contactName}</strong>,</p>
                
                <div class="success">
                  <strong>✓ Your payment has been confirmed!</strong>
                </div>
                
                <div class="info">
                  <strong>Payment Details:</strong><br>
                  Amount: ₹${(updated.paymentAmount || 0).toLocaleString()}<br>
                  Method: ${updated.paymentMethod}<br>
                  Reference: ${updated.paymentReference || 'N/A'}<br>
                  Date: ${updated.paidAt?.toLocaleString()}
                </div>
                
                <div class="info">
                  <strong>Next Steps:</strong><br>
                  1. Booth will be allocated shortly<br>
                  2. You'll receive your booth number<br>
                  3. QR code will be generated for event access
                </div>
                
                <p>Thank you for your payment!</p>
                
                <div class="footer">
                  <p>EventPlanner © 2025 | All rights reserved</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
            }).catch(err => console.error('Failed to send payment confirmation email:', err))
        }

        console.log(`Payment confirmed for exhibitor: ${exhibitor.id}`)

        return NextResponse.json({
            message: 'Payment confirmed successfully',
            exhibitor: {
                id: updated.id,
                company: updated.name,
                status: updated.status,
                paymentStatus: updated.paymentStatus,
                paidAt: updated.paidAt
            }
        })
    } catch (e: any) {
        console.error('Payment confirmation error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
