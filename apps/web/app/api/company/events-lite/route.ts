import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user?.currentTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = session.user.currentTenantId

    const base = process.env.INTERNAL_API_BASE_URL || 'http://localhost:8081'
    const url = `${base}/api/events?page=0&size=100`
    const eventsRes = await fetch(url, { headers: { 'x-tenant-id': tenantId } })
    const eventsData = eventsRes.ok ? await eventsRes.json() : []
    const events = (eventsData.content || eventsData || []).map((e: any) => ({
      id: String(e.id),
      name: e.name || e.title || 'Untitled Event'
    }))

    return NextResponse.json({ events })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load events' }, { status: 500 })
  }
}
