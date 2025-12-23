import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const permError = await checkPermissionInRoute('events.manage_registrations', 'Allocate Booth')
  if (permError) return permError

  try {
    const body = await req.json()
    const { boothNumber, boothArea, boothPrice } = body

    if (!boothNumber) {
      return NextResponse.json({ message: 'Booth number required' }, { status: 400 })
    }

    // Fetch exhibitor
    const exhibitor = await prisma.exhibitor.findUnique({
      where: { id: params.exhibitorId }
    })

    if (!exhibitor) {
      return NextResponse.json({ message: 'Exhibitor not found' }, { status: 404 })
    }

    // Calculate costs
    const basePrice = boothPrice || 10000 // Default booth price
    const electricalFee = exhibitor.electricalAccess ? 500 : 0
    const tableFee = exhibitor.displayTables ? 300 : 0
    const subtotal = basePrice + electricalFee + tableFee
    const taxRate = 0.18 // 18% GST
    const tax = Math.round(subtotal * taxRate)
    const total = subtotal + tax

    // Update exhibitor with booth allocation
    const updated = await prisma.exhibitor.update({
      where: { id: params.exhibitorId },
      data: {
        boothNumber: boothNumber,
        boothArea: boothArea,
        status: 'PAYMENT_PENDING',
        paymentAmount: total,
        allocatedAt: new Date()
      }
    })

    // Fetch event details
    const event = await prisma.event.findUnique({
      where: { id: BigInt(params.id) },
      select: { name: true, startsAt: true, endsAt: true }
    })
    const eventName = event?.name || `Event #${params.id}`

    // Generate payment link (placeholder - integrate with Razorpay/Stripe)
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/events/${params.id}/exhibitors/${params.exhibitorId}/payment`

    // Send payment email to exhibitor
    const to = exhibitor.contactEmail || ''
    if (to) {
      await sendEmail({
        to,
        subject: `Booth Allocated - Payment Required for ${eventName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .booth-info { background: white; border: 2px solid #4F46E5; padding: 20px; margin: 20px 0; border-radius: 10px; }
              .booth-number { font-size: 36px; font-weight: bold; color: #4F46E5; margin: 10px 0; }
              .cost-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
              .cost-table th { background: #F3F4F6; padding: 12px; text-align: left; border-bottom: 2px solid #E5E7EB; }
              .cost-table td { padding: 12px; border-bottom: 1px solid #E5E7EB; }
              .cost-table tr:last-child td { border-bottom: none; }
              .total-row { background: #FEF3C7; font-weight: bold; font-size: 18px; }
              .payment-button { display: inline-block; background: #4F46E5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .payment-button:hover { background: #4338CA; }
              .info { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 10px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Booth Allocated!</h1>
                <p>${eventName}</p>
              </div>
              <div class="content">
                <p>Hi <strong>${exhibitor.contactName || exhibitor.name}</strong>,</p>
                
                <div class="success">
                  <strong>✓ Your booth has been allocated!</strong>
                </div>
                
                <div class="booth-info">
                  <h2 style="margin-top: 0; color: #4F46E5;">Your Booth Details</h2>
                  <div class="booth-number">Booth #${boothNumber}</div>
                  ${boothArea ? `<p><strong>Area:</strong> ${boothArea}</p>` : ''}
                  <p><strong>Company:</strong> ${exhibitor.company || exhibitor.name}</p>
                  <p><strong>Booth Type:</strong> ${exhibitor.boothOption || 'Standard'}</p>
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
                      <td>Booth Fee (${exhibitor.boothOption || 'Standard'})</td>
                      <td style="text-align: right;">₹${basePrice.toLocaleString()}</td>
                    </tr>
                    ${electricalFee > 0 ? `
                    <tr>
                      <td>Electrical Access</td>
                      <td style="text-align: right;">₹${electricalFee.toLocaleString()}</td>
                    </tr>
                    ` : ''}
                    ${tableFee > 0 ? `
                    <tr>
                      <td>Display Tables</td>
                      <td style="text-align: right;">₹${tableFee.toLocaleString()}</td>
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
                  <strong>📌 Important Information:</strong><br>
                  • Payment must be completed to confirm your booth<br>
                  • Your booth will be reserved for 48 hours<br>
                  • After payment, you'll receive a confirmation email with QR code<br>
                  • Event Date: ${event?.startsAt ? new Date(event.startsAt).toLocaleDateString() : 'TBD'}
                </div>
                
                <p>If you have any questions, please contact our support team.</p>
                
                <div class="footer">
                  <p>EventPlanner © 2025 | All rights reserved</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Booth Allocated for ${eventName}\n\nBooth Number: ${boothNumber}\nTotal Amount: ₹${total}\n\nPlease complete payment at: ${paymentLink}`
      }).catch(err => console.error('Failed to send payment email:', err))
    }

    console.log(`Booth allocated for exhibitor: ${exhibitor.id}, Booth: ${boothNumber}, Amount: ₹${total}`)

    return NextResponse.json({
      message: 'Booth allocated successfully. Payment email sent.',
      exhibitor: {
        id: updated.id,
        company: updated.name,
        status: updated.status,
        boothNumber: updated.boothNumber,
        boothArea: updated.boothArea,
        paymentAmount: total
      },
      payment: {
        subtotal,
        tax,
        total,
        paymentLink
      }
    })
  } catch (e: any) {
    console.error('Booth allocation error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
