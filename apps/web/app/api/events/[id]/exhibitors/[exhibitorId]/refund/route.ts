import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { reason, refundAmount } = body

        const exhibitor = await prisma.exhibitor.findUnique({
            where: { id: params.exhibitorId }
        })

        if (!exhibitor) {
            return NextResponse.json({ message: 'Exhibitor not found' }, { status: 404 })
        }

        if (exhibitor.paymentStatus !== 'COMPLETED') {
            return NextResponse.json({
                message: 'Cannot refund - payment not completed'
            }, { status: 400 })
        }

        const amountToRefund = refundAmount || exhibitor.paymentAmount || 0

        // Update exhibitor status to REFUNDED
        const updated = await prisma.exhibitor.update({
            where: { id: params.exhibitorId },
            data: {
                status: 'REFUNDED',
                paymentStatus: 'REFUNDED',
                refundedAt: new Date(),
                notes: exhibitor.notes
                    ? `${exhibitor.notes}\n\nRefund: ₹${amountToRefund} - ${reason || 'No reason provided'}`
                    : `Refund: ₹${amountToRefund} - ${reason || 'No reason provided'}`
            }
        })

        // Fetch event details
        const event = await prisma.event.findUnique({
            where: { id: BigInt(params.id) },
            select: { name: true }
        })

        // Send refund confirmation email
        if (exhibitor.contactEmail) {
            await sendEmail({
                to: exhibitor.contactEmail,
                subject: `Refund Processed - ${event?.name}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #EF4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1>💸 Refund Processed</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hi <strong>${exhibitor.contactName || exhibitor.name}</strong>,</p>
              
              <p>Your refund has been processed for <strong>${event?.name}</strong>.</p>
              
              <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #991B1B;">Refund Details</h3>
                <p><strong>Booth Number:</strong> ${exhibitor.boothNumber || 'N/A'}</p>
                <p><strong>Original Amount:</strong> ₹${(exhibitor.paymentAmount || 0).toLocaleString()}</p>
                <p><strong>Refund Amount:</strong> ₹${amountToRefund.toLocaleString()}</p>
                <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
              </div>
              
              <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>⏱️ Processing Time:</strong></p>
                <p style="margin: 5px 0 0 0;">The refund will be credited to your original payment method within 5-7 business days.</p>
              </div>
              
              <p>If you have any questions about this refund, please contact us.</p>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Thank you,<br>
                ${event?.name} Team
              </p>
            </div>
          </div>
        `,
                text: `Refund Processed\n\nAmount: ₹${amountToRefund}\nReason: ${reason || 'Not specified'}\n\nThe refund will be credited within 5-7 business days.`
            }).catch(err => console.error('Failed to send refund email:', err))
        }

        console.log(`✅ Refund processed for exhibitor: ${exhibitor.id}, Amount: ₹${amountToRefund}`)

        return NextResponse.json({
            message: 'Refund processed successfully',
            exhibitor: {
                id: updated.id,
                status: updated.status,
                paymentStatus: updated.paymentStatus,
                refundedAt: updated.refundedAt
            },
            refund: {
                amount: amountToRefund,
                reason: reason || 'Not specified'
            }
        })

    } catch (error: any) {
        console.error('Refund error:', error)
        return NextResponse.json({
            message: 'Failed to process refund',
            error: error.message
        }, { status: 500 })
    }
}
