
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    // if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const eventId = params.id

    console.log('📡 Fetching team members for event:', eventId)

    // Fetch assigned roles (Confirmed members) - use safe type casting
    const assignments = await (prisma as any).eventRoleAssignment?.findMany({
      where: { eventId: eventId },
      orderBy: { createdAt: 'desc' }
    }) || []

    console.log(`✅ Found ${assignments.length} role assignments`)

    const userIds = assignments.map((a: any) => a.userId)

    let users: any[] = []
    if (userIds.length > 0) {
      users = await (prisma as any).user?.findMany({
        where: { id: { in: userIds } }
      }) || []
    }

    console.log(`✅ Found ${users.length} users`)

    const userMap = new Map(users.map((u: any) => [String(u.id), u]))

    const items = assignments.map((a: any) => {
      const u = userMap.get(String(a.userId))
      return {
        id: String(a.id),
        userId: String(a.userId),
        name: u?.name || 'Unknown User',
        email: u?.email || 'unknown@example.com',
        role: a.role || 'STAFF',
        status: 'JOINED',
        imageUrl: u?.image || null,
        joinedAt: a.createdAt,
        progress: 100
      }
    })

    console.log(`✅ Returning ${items.length} team members`)

    return NextResponse.json({
      items,
      total: items.length,
      totalPages: 1,
      page: 1,
      limit: items.length
    })

  } catch (error: any) {
    console.error('❌ Error fetching team members:', error)
    return NextResponse.json({
      message: 'Failed to load team members',
      error: error.message,
      details: 'EventRoleAssignment model may not be available. Please run: npx prisma generate'
    }, { status: 500 })
  }
}
