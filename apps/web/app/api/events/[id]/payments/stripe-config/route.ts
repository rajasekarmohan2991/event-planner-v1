import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/payments/stripe-config - get Stripe configuration
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    if (isNaN(eventId)) {
      return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 })
    }

    // Return Stripe publishable key (safe to expose to client)
    return NextResponse.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      enabled: !!process.env.STRIPE_SECRET_KEY,
      supportedMethods: ['card', 'upi', 'netbanking', 'wallet']
    })
  } catch (e: any) {
    console.error('Error fetching Stripe config:', e)
    return NextResponse.json({ 
      message: e?.message || 'Failed to fetch Stripe config' 
    }, { status: 500 })
  }
}
