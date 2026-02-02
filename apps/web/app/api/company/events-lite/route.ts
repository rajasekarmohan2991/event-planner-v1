import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user?.currentTenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = session.user.currentTenantId

    // Use Prisma directly to avoid lag/caching issues from Java API
    const events = await prisma.event.findMany({
      where: {
        tenantId: tenantId,
        // Optional: filter by status if needed, but 'All Events' usually implies all
      },
      select: {
        id: true,
        name: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const serializedEvents = events.map(e => ({
      id: String(e.id),
      name: e.name || 'Untitled Event'
    }))

    return NextResponse.json({ events: serializedEvents })
  } catch (e: any) {
    console.error('Events Lite Error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to load events' }, { status: 500 })
  }
}
