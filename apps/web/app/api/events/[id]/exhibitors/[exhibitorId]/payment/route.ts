import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import { sendEmail } from '@/lib/email'
import QRCode from 'qrcode'
import crypto from 'crypto'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const permError = await checkPermissionInRoute('events.manage_registrations', 'Confirm Payment')
  if (permError) return permError

  try {
    const body = await req.json()
    const { paymentMethod, paymentReference, amount } = body

    const exhibitor = await prisma.exhibitor.findUnique({
      where: { id: params.exhibitorId }
    })

    if (!exhibitor) {
      return NextResponse.json({ message: 'Exhibitor not found' }, { status: 404 })
    }

    // Generate QR code data
    const checkInCode = `EXH-${params.id}-${exhibitor.id}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    const qrData = {
      type: 'EXHIBITOR',
      exhibitorId: exhibitor.id,
      eventId: params.id,
      company: exhibitor.company || exhibitor.name,
      contactEmail: exhibitor.contactEmail,
      boothNumber: exhibitor.boothNumber,
      checkInCode: checkInCode,
      timestamp: new Date().toISOString()
    }

    // Generate QR code image
    let qrCodeDataURL = ''
    try {
      qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    } catch (qrError) {
      console.error('QR code generation failed:', qrError)
    }

    // Update payment status and generate QR code
    const updated = await prisma.exhibitor.update({
      where: { id: params.exhibitorId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: paymentMethod || exhibitor.paymentMethod || 'ONLINE',
        paymentReference: paymentReference,
        paymentAmount: amount || exhibitor.paymentAmount,
        paidAt: new Date(),
        status: 'BOOTH_ALLOTTED',
        qrCode: qrCodeDataURL,
        qrCodeData: JSON.stringify(qrData),
        checkInCode: checkInCode
      }
    })

    // Fetch event details
    const event = await prisma.event.findUnique({
      where: { id: BigInt(params.id) },
      select: { name: true, startsAt: true, endsAt: true, venue: true, address: true }
    })
    const eventName = event?.name || `Event #${params.id}`

    // Send payment confirmation email with QR code
    const to = exhibitor.contactEmail || ''
    if (to && qrCodeDataURL) {
      await sendEmail({
        to,
        subject: `Payment Confirmed - Booth Confirmed for ${eventName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .success h2 { margin: 0; color: #155724; }
              .booth-info { background: white; border: 2px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
              .booth-number { font-size: 48px; font-weight: bold; color: #10B981; margin: 10px 0; }
              .payment-details { background: #F3F4F6; padding: 15px; margin: 20px 0; border-radius: 8px; }
              .qr-code { margin: 30px 0; text-align: center; }
              .qr-code img { max-width: 300px; height: auto; border: 3px solid #10B981; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .check-in-code { background: #FEF3C7; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 20px; font-weight: bold; color: #92400E; margin: 20px 0; text-align: center; }
              .info { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 10px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #E5E7EB; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Payment Confirmed!</h1>
                <p>Your booth is now confirmed</p>
              </div>
              <div class="content">
                <p>Hi <strong>${exhibitor.contactName || exhibitor.name}</strong>,</p>
                
                <div class="success">
                  <h2>✓ Payment Received Successfully!</h2>
                  <p style="margin: 10px 0 0 0;">Your booth has been confirmed for ${eventName}</p>
                </div>
                
                ${exhibitor.boothNumber ? `
                <div class="booth-info">
                  <h2 style="margin-top: 0; color: #10B981;">Your Confirmed Booth</h2>
                  <div class="booth-number">#${exhibitor.boothNumber}</div>
                  ${exhibitor.boothArea ? `<p><strong>Area:</strong> ${exhibitor.boothArea}</p>` : ''}
                  <p><strong>Company:</strong> ${exhibitor.company || exhibitor.name}</p>
                </div>
                ` : ''}
                
                <div class="payment-details">
                  <h3 style="margin-top: 0; color: #1F2937;">Payment Receipt</h3>
                  <p><strong>Amount Paid:</strong> ₹${(updated.paymentAmount || 0).toLocaleString()}</p>
                  <p><strong>Payment Method:</strong> ${updated.paymentMethod}</p>
                  ${updated.paymentReference ? `<p><strong>Reference:</strong> ${updated.paymentReference}</p>` : ''}
                  <p><strong>Date:</strong> ${updated.paidAt ? new Date(updated.paidAt).toLocaleString() : 'N/A'}</p>
                </div>
                
                <div class="qr-code">
                  <h3 style="color: #1F2937;">Your Exhibitor QR Code</h3>
                  <p style="color: #6B7280; margin-bottom: 15px;">Show this QR code for event access and booth check-in</p>
                  <img src="${qrCodeDataURL}" alt="Exhibitor QR Code" />
                </div>
                
                <div class="check-in-code">
                  Check-in Code: ${checkInCode}
                </div>
                
                <div class="info">
                  <strong>📅 Event Details:</strong><br>
                  <strong>Event:</strong> ${eventName}<br>
                  ${event?.startsAt ? `<strong>Date:</strong> ${new Date(event.startsAt).toLocaleDateString()}<br>` : ''}
                  ${event?.venue ? `<strong>Venue:</strong> ${event.venue}<br>` : ''}
                  ${event?.address ? `<strong>Address:</strong> ${event.address}<br>` : ''}
                </div>
                
                <div class="info">
                  <strong>📱 Important Instructions:</strong><br>
                  • Save this email or screenshot the QR code<br>
                  • Arrive at least 1 hour early for booth setup<br>
                  • Bring this QR code for quick check-in<br>
                  • Your booth number is displayed above<br>
                  • Contact organizer for any setup questions
                </div>
                
                <p style="margin-top: 30px; text-align: center; font-size: 16px;">
                  <strong>Thank you for your participation!</strong><br>
                  We look forward to seeing you at ${eventName}!
                </p>
                
                <div class="footer">
                  <p>EventPlanner © 2025 | All rights reserved</p>
                  <p style="margin-top: 10px; font-size: 11px;">
                    This is an automated confirmation email. Please do not reply to this email.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `Payment Confirmed for ${eventName}\n\nBooth Number: ${exhibitor.boothNumber || 'TBA'}\nAmount: ₹${(updated.paymentAmount || 0).toLocaleString()}\nCheck-in Code: ${checkInCode}\n\nPlease save this email for event access.`
      }).catch(err => console.error('Failed to send confirmation email:', err))
    }

    console.log(`✅ Payment confirmed for exhibitor: ${exhibitor.id}, Status: BOOTH_ALLOTTED, QR Code generated`)

    // Generate and send invoice automatically
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/events/${params.id}/exhibitors/${params.exhibitorId}/generate-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      console.log('✅ Invoice generated and sent')
    } catch (invoiceError) {
      console.error('⚠️ Failed to generate invoice:', invoiceError)
      // Don't fail the payment confirmation if invoice generation fails
    }

    return NextResponse.json({
      message: 'Payment confirmed successfully. Booth allotted! Invoice sent to your email.',
      exhibitor: {
        id: updated.id,
        company: updated.name,
        status: updated.status,
        paymentStatus: updated.paymentStatus,
        boothNumber: updated.boothNumber,
        checkInCode: updated.checkInCode,
        qrCode: updated.qrCode,
        paidAt: updated.paidAt
      }
    })
  } catch (e: any) {
    console.error('Payment confirmation error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
