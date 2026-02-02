import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRecentActivities } from '@/lib/activity-logger'

export const dynamic = 'force-dynamic'

// Helper to enforce timeouts on promises
function timeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      timer = setTimeout(() => {
        resolve(fallback)
      }, ms)
    })
  ]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check authorization
    const userRole = (session as any).user.role as string
    if (!['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get real activities from database with fail-safe timeout
    const activities = await timeout(
      getRecentActivities(limit, offset),
      3000, // 3s max wait
      []
    )

    return NextResponse.json(activities)

  } catch (error: any) {
    console.error('Error fetching recent activities:', error)
    return NextResponse.json(
      { message: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
