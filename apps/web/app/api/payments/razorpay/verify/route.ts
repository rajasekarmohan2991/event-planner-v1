import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { verifyPaymentSignature, getPaymentDetails } from '@/lib/razorpay'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      registrationId,
      eventId 
    } = await req.json()

    // Verify payment signature
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    })

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Get payment details from Razorpay
    const paymentResult = await getPaymentDetails(razorpay_payment_id)
    if (!paymentResult.success) {
      return NextResponse.json({ error: 'Failed to fetch payment details' }, { status: 500 })
    }

    const payment = paymentResult.payment

    if (!payment) {
      return NextResponse.json({ error: 'Payment details not found' }, { status: 404 })
    }

    // Update registration with payment info
    const updated = await prisma.$queryRaw`
      UPDATE registrations 
      SET 
        data_json = jsonb_set(
          COALESCE(data_json, '{}'),
          '{payment}',
          jsonb_build_object(
            'method', 'razorpay',
            'status', 'completed',
            'amount', ${payment.amount},
            'currency', ${payment.currency},
            'razorpay_order_id', ${razorpay_order_id},
            'razorpay_payment_id', ${razorpay_payment_id},
            'razorpay_signature', ${razorpay_signature},
            'paidAt', ${new Date().toISOString()},
            'transactionId', ${razorpay_payment_id}
          )
        ),
        updated_at = NOW()
      WHERE id = ${registrationId} AND event_id = ${eventId}
      RETURNING id, event_id as "eventId", data_json as "dataJson", type, created_at as "createdAt"
    `

    const registration = (updated as any)[0]

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Generate QR code for paid registration
    const qrData = {
      registrationId: registration.id,
      eventId: eventId,
      email: registration.dataJson?.email,
      name: registration.dataJson?.name,
      type: registration.type,
      paymentStatus: 'paid',
      paymentId: razorpay_payment_id,
      timestamp: new Date().toISOString()
    }
    
    const qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64')
    const checkInUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/events/${eventId}/checkin?token=${qrCode}`

    // Send confirmation email
    try {
      const eventRes = await fetch(`${process.env.NEXTAUTH_URL}/api/events/${eventId}`)
      const eventData = eventRes.ok ? await eventRes.json() : null
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Successful - Razorpay</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #528FF0; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .qr-section { background: white; padding: 20px; margin: 20px 0; text-align: center; border: 2px dashed #528FF0; }
            .button { display: inline-block; background: #528FF0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Payment Successful!</h1>
              <p>Powered by Razorpay</p>
            </div>
            
            <div class="content">
              <h2>Payment Details</h2>
              <p><strong>Event:</strong> ${eventData?.name || `Event #${eventId}`}</p>
              <p><strong>Registration ID:</strong> #${registration.id}</p>
              <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
              <p><strong>Amount:</strong> ₹${(Number(payment.amount) / 100).toFixed(2)}</p>
              <p><strong>Status:</strong> <span style="color: #16a34a;">Successful</span></p>
              
              <div class="qr-section">
                <h3>📱 Your QR Code for Check-in</h3>
                <p>Show this QR code at the event entrance:</p>
                <div style="font-family: monospace; background: #f3f4f6; padding: 10px; margin: 10px 0; word-break: break-all; font-size: 10px;">
                  ${qrCode}
                </div>
                <a href="${checkInUrl}" class="button">Open Check-in Link</a>
              </div>
              
              <h3>What's Next?</h3>
              <ul>
                <li>Save this email for your records</li>
                <li>Screenshot the QR code for quick access</li>
                <li>Arrive 15 minutes early for smooth check-in</li>
                <li>Your payment is secured by Razorpay</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>Thank you for your payment! We look forward to seeing you at the event.</p>
              <p>Payment processed securely by Razorpay</p>
            </div>
          </div>
        </body>
        </html>
      `

      // Send email (fire and forget)
      fetch(`${process.env.NEXTAUTH_URL}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: registration.dataJson?.email,
          subject: `Payment Successful - ${eventData?.name || 'Event Registration'}`,
          html: emailHtml,
          text: `Payment successful for ${eventData?.name || 'Event'}. Registration ID: #${registration.id}. Payment ID: ${razorpay_payment_id}. QR Code: ${qrCode}`
        })
      }).catch(err => console.error('Email send error:', err))
    } catch (emailError) {
      console.error('Email preparation error:', emailError)
    }

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      qrCode,
      checkInUrl,
      registration
    })

  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
