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

    // Determine tax rate from payment settings (fallback 18)
    let taxRate = 18
    try {
      const settingsRes = await fetch(`${process.env.NEXTAUTH_URL}/api/events/${eventId}/payment-settings`, { cache: 'no-store' })
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        const r = Number(settings?.taxRatePercent)
        if ([0,12,18,28].includes(r)) taxRate = r
      }
    } catch {}

    // Determine currency from company settings (fallback INR)
    let currency = 'inr'
    try {
      const cfg = await fetch(`${process.env.NEXTAUTH_URL}/api/company/settings`, { cache: 'no-store' })
      if (cfg.ok) {
        const json = await cfg.json()
        if (json?.currency) currency = String(json.currency).toLowerCase()
      }
    } catch {}

    // Compute tax breakdown. Incoming amount is in minor units already from client.
    const subtotalInMinor = Math.round(Number(amount))
    const taxAmountInMinor = Math.round(subtotalInMinor * (taxRate / 100))
    const totalInMinor = subtotalInMinor + taxAmountInMinor

    // Create payment intent with total and breakdown metadata
    const result = await createPaymentIntent({
      amount: totalInMinor,
      currency,
      description: description || `Event Registration - Event #${eventId}`,
      metadata: {
        eventId: eventId.toString(),
        registrationId: registrationId.toString(),
        userId: (session.user as any)?.id || '',
        subtotalInMinor: String(subtotalInMinor),
        taxAmountInMinor: String(taxAmountInMinor),
        taxRatePercent: String(taxRate),
        totalInMinor: String(totalInMinor)
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
      subtotalInMinor,
      taxAmountInMinor,
      taxRatePercent: taxRate,
      totalInMinor,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    })

  } catch (error: any) {
    console.error('Stripe payment intent creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
