import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    // Construct webhook event
    const result = constructWebhookEvent(body, signature)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const event = result.event

    console.log(`🔔 Stripe webhook received: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log(`💰 Payment succeeded: ${paymentIntent.id}`)
        
        // Update registration status
        if (paymentIntent.metadata?.registrationId) {
          await prisma.$executeRaw`
            UPDATE registrations 
            SET data_json = jsonb_set(
              COALESCE(data_json, '{}'),
              '{payment}',
              jsonb_build_object(
                'method', 'stripe',
                'status', 'completed',
                'amount', ${paymentIntent.amount},
                'currency', ${paymentIntent.currency},
                'stripe_payment_intent_id', ${paymentIntent.id},
                'paidAt', ${new Date().toISOString()},
                'webhook_processed', true
              )
            )
            WHERE id = ${parseInt(paymentIntent.metadata.registrationId)}
          `
          console.log(`✅ Registration ${paymentIntent.metadata.registrationId} updated`)
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        console.log(`❌ Payment failed: ${failedPayment.id}`)
        
        // Update registration with failed status
        if (failedPayment.metadata?.registrationId) {
          await prisma.$executeRaw`
            UPDATE registrations 
            SET data_json = jsonb_set(
              COALESCE(data_json, '{}'),
              '{payment}',
              jsonb_build_object(
                'method', 'stripe',
                'status', 'failed',
                'stripe_payment_intent_id', ${failedPayment.id},
                'failedAt', ${new Date().toISOString()},
                'webhook_processed', true
              )
            )
            WHERE id = ${parseInt(failedPayment.metadata.registrationId)}
          `
          console.log(`❌ Registration ${failedPayment.metadata.registrationId} marked as failed`)
        }
        break

      case 'charge.dispute.created':
        const dispute = event.data.object
        console.log(`⚠️ Dispute created: ${dispute.id}`)
        
        // Handle dispute - could send notification to admin
        // TODO: Implement dispute handling logic
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object
        console.log(`📄 Invoice payment succeeded: ${invoice.id}`)
        break

      case 'customer.created':
        const customer = event.data.object
        console.log(`👤 Customer created: ${customer.id}`)
        break

      default:
        console.log(`🤷 Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('❌ Stripe webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
