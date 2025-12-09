import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { createPaymentIntent, createCustomer } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { 
      amount, 
      eventId, 
      registrationId, 
      currency = 'inr',
      customerEmail,
      customerName,
      description 
    } = await req.json()

    if (!amount || !eventId || !registrationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create or get customer
    let customerId = null
    if (customerEmail) {
      const customerResult = await createCustomer({
        email: customerEmail,
        name: customerName,
        metadata: {
          eventId: eventId.toString(),
          registrationId: registrationId.toString(),
          userId: (session.user as any)?.id || ''
        }
      })

      if (customerResult.success) {
        customerId = customerResult.customer?.id
      }
    }

    // Create payment intent
    const result = await createPaymentIntent({
      amount: Math.round(amount), // Ensure integer (cents)
      currency,
      description: description || `Event Registration - Event #${eventId}`,
      metadata: {
        eventId: eventId.toString(),
        registrationId: registrationId.toString(),
        userId: (session.user as any)?.id || ''
      },
      customer: customerId
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      clientSecret: result.paymentIntent?.client_secret,
      paymentIntentId: result.paymentIntent?.id,
      amount: result.paymentIntent?.amount,
      currency: result.paymentIntent?.currency,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    })

  } catch (error: any) {
    console.error('Stripe payment intent creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
