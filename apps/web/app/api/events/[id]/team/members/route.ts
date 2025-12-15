
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    // if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // const eventId = params.id

    // Fetch assigned roles (Confirmed members)
    const assignments = await prisma.eventRoleAssignment.findMany({
      where: { eventId: params.id },
      orderBy: { createdAt: 'desc' }
    })

    const userIds = assignments.map(a => a.userId)

    let users: any[] = []
    if (userIds.length > 0) {
      users = await prisma.user.findMany({
        where: { id: { in: userIds } }
      })
    }

    const userMap = new Map(users.map(u => [String(u.id), u]))

    const items = assignments.map(a => {
      const u = userMap.get(String(a.userId))
      return {
        id: String(a.id),
        userId: String(a.userId),
        name: u?.name || 'Unknown User',
        email: u?.email || 'unknown@example.com',
        role: a.role,
        status: 'JOINED',
        imageUrl: u?.image,
        joinedAt: a.createdAt,
        progress: 100
      }
    })

    // Also fetch Invitations if possible? 
    // Currently Schema doesn't seem to have specific EventInvite table clearly defined or verified.
    // We will stick to configured members for now to fix the 500 error.

    return NextResponse.json({
      items,
      total: items.length,
      totalPages: 1,
      page: 1,
      limit: items.length
    })

  } catch (error: any) {
    console.error('Error fetching team members:', error)
    return NextResponse.json({ message: 'Failed to load team members', error: error.message }, { status: 500 })
  }
}
