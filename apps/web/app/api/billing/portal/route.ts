import { NextRequest, NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/saas/tenant'
import { getStripe, isStripeConfigured } from '@/lib/saas/stripe'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) return NextResponse.json({ message: 'Billing not configured' }, { status: 501 })
  const stripe = getStripe()!
  const ctx = await getTenantContext()
  // For demo: require customer id from body; in production, map orgId -> stripeCustomerId in DB
  const { customerId, return_url = `${process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000'}/settings/billing` } = await req.json().catch(()=>({}))
  if (!customerId) return NextResponse.json({ message: 'Missing customerId' }, { status: 400 })
  const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url })
  return NextResponse.json({ url: session.url })
}
