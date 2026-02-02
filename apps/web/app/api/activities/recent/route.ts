import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRecentActivities } from '@/lib/activity'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const tenantId = searchParams.get('tenantId') || undefined

    const activities = await getRecentActivities(limit, tenantId)

    return NextResponse.json({ activities })
  } catch (error: any) {
    console.error('Failed to fetch recent activities:', error)
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
