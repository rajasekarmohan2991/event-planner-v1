import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, currency = 'inr', registrationId, eventId } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to paise/cents
      currency: currency.toLowerCase(),
      metadata: {
        registrationId: registrationId || '',
        eventId: eventId || '',
        userId: (session.user as any)?.id || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error: any) {
    console.error('Stripe payment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
