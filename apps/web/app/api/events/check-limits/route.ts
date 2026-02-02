import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canCreateEvent, getSubscriptionStatus } from '@/lib/subscription-check'

export const dynamic = 'force-dynamic'

/**
 * GET /api/events/check-limits
 * Check if user can create events based on subscription
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.currentTenantId) {
      return NextResponse.json(
        { error: 'No active tenant' },
        { status: 400 }
      )
    }

    const tenantId = session.user.currentTenantId
    
    // Get full subscription status
    const status = await getSubscriptionStatus(tenantId)
    
    if (!status) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Check if can create event
    const eventCheck = await canCreateEvent(tenantId)

    return NextResponse.json({
      success: true,
      subscription: status,
      canCreateEvent: eventCheck.canCreateEvent,
      reason: eventCheck.reason,
      limits: {
        events: {
          current: eventCheck.currentCount,
          max: eventCheck.maxAllowed
        }
      }
    })
  } catch (error: any) {
    console.error('Error checking limits:', error)
    return NextResponse.json(
      { error: 'Failed to check limits', details: error.message },
      { status: 500 }
    )
  }
}
