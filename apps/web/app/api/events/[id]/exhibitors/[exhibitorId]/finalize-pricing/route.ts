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
        const { basePrice, electricalPrice, tablesPrice, otherCharges, notes } = body

        const exhibitor = await prisma.exhibitor.findUnique({
            where: { id: params.exhibitorId }
        })

        if (!exhibitor) {
            return NextResponse.json({ message: 'Exhibitor not found' }, { status: 404 })
        }

        // Calculate total
        const base = parseFloat(basePrice) || 0
        const electrical = exhibitor.electricalAccess ? (parseFloat(electricalPrice) || 0) : 0
        const tables = exhibitor.displayTables ? (parseFloat(tablesPrice) || 0) : 0
        const other = parseFloat(otherCharges) || 0

        const subtotal = base + electrical + tables + other
        const tax = Math.round(subtotal * 0.18) // 18% GST
        const total = subtotal + tax

        // Generate payment link
        const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/events/${params.id}/exhibitors/${params.exhibitorId}/payment`

        // Update exhibitor with pricing
        const updated = await prisma.exhibitor.update({
            where: { id: params.exhibitorId },
            data: {
                paymentAmount: total,
                status: 'PAYMENT_PENDING',
                notes: notes || exhibitor.notes
            }
        })

        // Fetch event details
        const event = await prisma.event.findUnique({
            where: { id: BigInt(params.id) },
            select: { name: true, startsAt: true }
        })

        // Send pricing email to exhibitor
        if (exhibitor.contactEmail) {
            await sendEmail({
                to: exhibitor.contactEmail,
                subject: `Payment Required - Booth #${exhibitor.boothNumber} - ${event?.name}`,
                html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .booth-info { background: white; border: 2px solid #4F46E5; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
              .booth-number { font-size: 36px; font-weight: bold; color: #4F46E5; margin: 10px 0; }
              .cost-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
              .cost-table th { background: #F3F4F6; padding: 12px; text-align: left; border-bottom: 2px solid #E5E7EB; }
              .cost-table td { padding: 12px; border-bottom: 1px solid #E5E7EB; }
              .total-row { background: #FEF3C7; font-weight: bold; font-size: 18px; }
              .payment-button { display: inline-block; background: #4F46E5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .info { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💰 Payment Required</h1>
                <p>${event?.name}</p>
              </div>
              <div class="content">
                <p>Hi <strong>${exhibitor.contactName || exhibitor.name}</strong>,</p>
                
                <div class="booth-info">
                  <h2 style="margin-top: 0; color: #4F46E5;">Your Booth</h2>
                  <div class="booth-number">Booth #${exhibitor.boothNumber}</div>
                  <p><strong>Company:</strong> ${exhibitor.company || exhibitor.name}</p>
                </div>
                
                <h3 style="color: #1F2937;">Payment Details</h3>
                <table class="cost-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style="text-align: right;">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Base Booth Fee</td>
                      <td style="text-align: right;">₹${base.toLocaleString()}</td>
                    </tr>
                    ${electrical > 0 ? `
                    <tr>
                      <td>Electrical Access</td>
                      <td style="text-align: right;">₹${electrical.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                    ${tables > 0 ? `
                    <tr>
                      <td>Display Tables</td>
                      <td style="text-align: right;">₹${tables.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                    ${other > 0 ? `
                    <tr>
                      <td>Other Charges</td>
                      <td style="text-align: right;">₹${other.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td><strong>Subtotal</strong></td>
                      <td style="text-align: right;"><strong>₹${subtotal.toLocaleString()}</strong></td>
                    </tr>
                    <tr>
                      <td>GST (18%)</td>
                      <td style="text-align: right;">₹${tax.toLocaleString()}</td>
                    </tr>
                    <tr class="total-row">
                      <td>TOTAL AMOUNT</td>
                      <td style="text-align: right;">₹${total.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${paymentLink}" class="payment-button">
                    💳 Pay Now - ₹${total.toLocaleString()}
                  </a>
                </div>
                
                <div class="info">
                  <strong>📌 Payment Instructions:</strong><br>
                  • Click the button above to complete payment<br>
                  • Payment must be completed within 48 hours<br>
                  • You'll receive a confirmation email with QR code after payment<br>
                  • Event Date: ${event?.startsAt ? new Date(event.startsAt).toLocaleDateString() : 'TBD'}
                </div>
                
                ${notes ? `
                <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>Additional Notes:</strong><br>
                  ${notes}
                </div>
                ` : ''}
                
                <p>If you have any questions, please contact us.</p>
              </div>
            </div>
          </body>
          </html>
        `,
                text: `Payment Required for Booth #${exhibitor.boothNumber}\n\nTotal Amount: ₹${total}\n\nPayment Link: ${paymentLink}`
            }).catch(err => console.error('Failed to send pricing email:', err))
        }

        console.log(`✅ Pricing finalized for exhibitor: ${exhibitor.id}, Amount: ₹${total}`)

        return NextResponse.json({
            message: 'Pricing finalized and payment link sent',
            exhibitor: {
                id: updated.id,
                status: updated.status,
                paymentAmount: total
            },
            pricing: {
                basePrice: base,
                electricalPrice: electrical,
                tablesPrice: tables,
                otherCharges: other,
                subtotal,
                tax,
                total
            },
            paymentLink
        })

    } catch (error: any) {
        console.error('Pricing error:', error)
        return NextResponse.json({
            message: 'Failed to finalize pricing',
            error: error.message
        }, { status: 500 })
    }
}
