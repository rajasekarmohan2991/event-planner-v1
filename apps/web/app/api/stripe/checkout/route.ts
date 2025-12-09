import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as any
    const { eventId, amount, currency, successUrl, cancelUrl, name = 'Event Registration' } = body

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const okSuccess = successUrl || `${origin}/events/${eventId}?payment=success`
    const okCancel = cancelUrl || `${origin}/events/${eventId}?payment=cancelled`

    // Demo fallback only (no Stripe SDK). To enable real Stripe, install 'stripe' and implement session creation.
    const mockUrl = `${okSuccess}&amount=${amount || 0}&currency=${currency || 'usd'}&name=${encodeURIComponent(name)}`
    return NextResponse.json({ id: 'cs_test_mock', url: mockUrl })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to create checkout session' }, { status: 500 })
  }
}
