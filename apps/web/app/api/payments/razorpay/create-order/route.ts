import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { createPaymentOrder } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { amount, eventId, registrationId } = await req.json()

    if (!amount || !eventId || !registrationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let taxRate = 18
    try {
      const settingsRes = await fetch(`${process.env.NEXTAUTH_URL}/api/events/${eventId}/payment-settings`, { cache: 'no-store' })
      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        const r = Number(settings?.taxRatePercent)
        if ([0,12,18,28].includes(r)) taxRate = r
      }
    } catch {}

    let currency = 'inr'
    try {
      const cfg = await fetch(`${process.env.NEXTAUTH_URL}/api/company/settings`, { cache: 'no-store' })
      if (cfg.ok) {
        const json = await cfg.json()
        if (json?.currency) currency = String(json.currency).toLowerCase()
      }
    } catch {}

    const subtotalInMinor = Math.round(Number(amount) * 100)
    const taxAmountInMinor = Math.round(subtotalInMinor * (taxRate / 100))
    const totalInMinor = subtotalInMinor + taxAmountInMinor

    const result = await createPaymentOrder({
      amount: totalInMinor,
      currency,
      receipt: `reg_${registrationId}_${Date.now()}`,
      notes: {
        eventId: eventId.toString(),
        registrationId: registrationId.toString(),
        userId: (session.user as any)?.id || '',
        subtotalInMinor: String(subtotalInMinor),
        taxAmountInMinor: String(taxAmountInMinor),
        taxRatePercent: String(taxRate),
        totalInMinor: String(totalInMinor)
      }
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      orderId: result.order?.id,
      amount: result.order?.amount,
      currency: result.order?.currency,
      subtotalInMinor,
      taxAmountInMinor,
      taxRatePercent: taxRate,
      totalInMinor,
      key: process.env.RAZORPAY_KEY_ID
    })

  } catch (error: any) {
    console.error('Razorpay order creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
