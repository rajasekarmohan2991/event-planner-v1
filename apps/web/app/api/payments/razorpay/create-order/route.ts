import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { createPaymentOrder } from '@/lib/razorpay'

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { amount, eventId, registrationId, currency = 'INR' } = await req.json()

    if (!amount || !eventId || !registrationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create Razorpay order
    const result = await createPaymentOrder({
      amount: Math.round(amount), // Ensure integer
      currency,
      receipt: `reg_${registrationId}_${Date.now()}`,
      notes: {
        eventId: eventId.toString(),
        registrationId: registrationId.toString(),
        userId: (session.user as any)?.id || ''
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
      key: process.env.RAZORPAY_KEY_ID
    })

  } catch (error: any) {
    console.error('Razorpay order creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
