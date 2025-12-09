import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { createRefund } from '@/lib/stripe'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Check if user has refund permissions
    const role = String(((session as any).user?.role) || '')
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return NextResponse.json({ message: 'Insufficient permissions for refunds' }, { status: 403 })
    }

    const { 
      registrationId,
      eventId,
      amount, // Optional - if not provided, full refund
      reason 
    } = await req.json()

    if (!registrationId || !eventId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get registration with payment info
    const registration = await prisma.$queryRaw`
      SELECT 
        id,
        data_json as "dataJson"
      FROM registrations 
      WHERE id = ${registrationId} AND event_id = ${eventId}
    `

    const reg = (registration as any)[0]
    if (!reg) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const paymentInfo = reg.dataJson?.payment
    if (!paymentInfo || paymentInfo.method !== 'stripe') {
      return NextResponse.json({ error: 'No Stripe payment found for this registration' }, { status: 400 })
    }

    if (paymentInfo.status === 'refunded') {
      return NextResponse.json({ error: 'Payment already refunded' }, { status: 400 })
    }

    const paymentIntentId = paymentInfo.stripe_payment_intent_id
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID not found' }, { status: 400 })
    }

    // Create refund in Stripe
    const refundResult = await createRefund(paymentIntentId, amount)
    if (!refundResult.success) {
      return NextResponse.json({ error: refundResult.error }, { status: 500 })
    }

    const refund = refundResult.refund

    // Update registration with refund info
    await prisma.$executeRaw`
      UPDATE registrations 
      SET 
        data_json = jsonb_set(
          data_json,
          '{payment}',
          jsonb_set(
            data_json->'payment',
            '{status}',
            '"refunded"'
          ) ||
          jsonb_build_object(
            'refund_id', ${refund?.id},
            'refund_amount', ${refund?.amount || amount},
            'refund_reason', ${reason || 'Admin refund'},
            'refundedAt', ${new Date().toISOString()},
            'refundedBy', ${(session.user as any)?.id}
          )
        ),
        updated_at = NOW()
      WHERE id = ${registrationId}
    `

    // Send refund confirmation email
    try {
      const eventRes = await fetch(`${process.env.NEXTAUTH_URL}/api/events/${eventId}`)
      const eventData = eventRes.ok ? await eventRes.json() : null
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Refund Processed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Refund Processed</h1>
              <p>Your payment has been refunded</p>
            </div>
            
            <div class="content">
              <h2>Refund Details</h2>
              <p><strong>Event:</strong> ${eventData?.name || `Event #${eventId}`}</p>
              <p><strong>Registration ID:</strong> #${registrationId}</p>
              <p><strong>Refund ID:</strong> ${refund?.id}</p>
              <p><strong>Refund Amount:</strong> ${paymentInfo.currency?.toUpperCase()} ${((refund?.amount || amount) / 100).toFixed(2)}</p>
              <p><strong>Reason:</strong> ${reason || 'Admin refund'}</p>
              
              <h3>What happens next?</h3>
              <ul>
                <li>The refund will appear in your original payment method within 5-10 business days</li>
                <li>You will receive a separate confirmation from your bank/card issuer</li>
                <li>Your event registration has been cancelled</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>If you have any questions, please contact our support team.</p>
              <p>Refund processed securely by Stripe</p>
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
          to: reg.dataJson?.email,
          subject: `Refund Processed - ${eventData?.name || 'Event Registration'}`,
          html: emailHtml,
          text: `Refund processed for ${eventData?.name || 'Event'}. Registration ID: #${registrationId}. Refund ID: ${refund?.id}. Amount: ${((refund?.amount || amount) / 100).toFixed(2)}`
        })
      }).catch(err => console.error('Email send error:', err))
    } catch (emailError) {
      console.error('Email preparation error:', emailError)
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund?.id,
        amount: refund?.amount,
        status: refund?.status,
        reason: reason || 'Admin refund'
      }
    })

  } catch (error: any) {
    console.error('Stripe refund error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
