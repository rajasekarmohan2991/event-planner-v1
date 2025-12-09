import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
  req: NextRequest, 
  { params }: { params: { id: string; registrationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethod, amount, status } = await req.json()
    const eventId = parseInt(params.id)
    const registrationId = parseInt(params.registrationId)

    // Update registration with payment information
    const updated = await prisma.$queryRaw`
      UPDATE registrations 
      SET 
        data_json = jsonb_set(
          COALESCE(data_json, '{}'),
          '{payment}',
          jsonb_build_object(
            'method', ${paymentMethod},
            'amount', ${amount},
            'status', ${status},
            'paidAt', ${new Date().toISOString()},
            'transactionId', ${`txn_${Date.now()}_${Math.random().toString(36).slice(2)}`}
          )
        ),
        updated_at = NOW()
      WHERE id = ${registrationId} AND event_id = ${eventId}
      RETURNING id, event_id as "eventId", data_json as "dataJson", type, created_at as "createdAt", updated_at as "updatedAt"
    `

    const registration = (updated as any)[0]

    if (!registration) {
      return NextResponse.json({ message: 'Registration not found' }, { status: 404 })
    }

    // Record payment row for history
    try {
      const amountInMinor = Math.round(Number(amount || 0) * 100)
      const userId = (session as any)?.user?.id ? BigInt((session as any).user.id) : null
      await prisma.$executeRaw`
        INSERT INTO payments (
          registration_id,
          event_id,
          user_id,
          amount_in_minor,
          currency,
          status,
          payment_method,
          payment_details,
          created_at,
          updated_at
        ) VALUES (
          ${BigInt(registrationId)},
          ${eventId},
          ${userId},
          ${amountInMinor},
          'INR',
          ${status || 'COMPLETED'},
          ${paymentMethod || 'UNKNOWN'},
          ${JSON.stringify({ amount, status, paymentMethod })}::jsonb,
          NOW(),
          NOW()
        )
      `
    } catch (e) {
      console.warn('Payment history insert failed:', e)
    }

    // Generate QR code for paid registration
    const qrData = {
      registrationId: registration.id,
      eventId: eventId,
      email: registration.dataJson?.email,
      name: registration.dataJson?.name,
      type: registration.type,
      paymentStatus: 'paid',
      timestamp: new Date().toISOString()
    }
    
    const qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64')
    const checkInUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/events/${eventId}/checkin?token=${qrCode}`

    // Send confirmation email with QR code
    try {
      const eventRes = await fetch(`${process.env.NEXTAUTH_URL}/api/events/${eventId}`)
      const eventData = eventRes.ok ? await eventRes.json() : null
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .qr-section { background: white; padding: 20px; margin: 20px 0; text-align: center; border: 2px dashed #4f46e5; }
            .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Payment Confirmed!</h1>
              <p>Your registration is complete</p>
            </div>
            
            <div class="content">
              <h2>Event Details</h2>
              <p><strong>Event:</strong> ${eventData?.name || `Event #${eventId}`}</p>
              <p><strong>Registration ID:</strong> #${registration.id}</p>
              <p><strong>Payment Method:</strong> ${paymentMethod}</p>
              <p><strong>Amount Paid:</strong> ₹${amount}</p>
              <p><strong>Transaction ID:</strong> txn_${Date.now()}_${Math.random().toString(36).slice(2)}</p>
              
              <div class="qr-section">
                <h3>📱 Your QR Code for Check-in</h3>
                <p>Show this QR code at the event entrance:</p>
                <div style="font-family: monospace; background: #f3f4f6; padding: 10px; margin: 10px 0; word-break: break-all; font-size: 10px;">
                  ${qrCode}
                </div>
                <p><small>QR Code: ${qrCode.substring(0, 20)}...</small></p>
                <a href="${checkInUrl}" class="button">Open Check-in Link</a>
              </div>
              
              <h3>What's Next?</h3>
              <ul>
                <li>Save this email for your records</li>
                <li>Screenshot the QR code for quick access</li>
                <li>Arrive 15 minutes early for smooth check-in</li>
                <li>Bring a valid ID for verification</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>Thank you for registering! We look forward to seeing you at the event.</p>
              <p>Need help? Contact us at support@eventplanner.com</p>
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
          subject: `Payment Confirmed - ${eventData?.name || 'Event Registration'}`,
          html: emailHtml,
          text: `Payment confirmed for ${eventData?.name || 'Event'}. Registration ID: #${registration.id}. QR Code: ${qrCode}. Check-in URL: ${checkInUrl}`
        })
      }).catch(err => console.error('Email send error:', err))
    } catch (emailError) {
      console.error('Email preparation error:', emailError)
    }

    return NextResponse.json({
      success: true,
      registration,
      payment: {
        method: paymentMethod,
        amount,
        status,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`
      },
      qrCode,
      checkInUrl
    })

  } catch (error: any) {
    console.error('Payment processing error:', error)
    return NextResponse.json({ message: error?.message || 'Payment failed' }, { status: 500 })
  }
}
