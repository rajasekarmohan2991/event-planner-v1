import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any)
  
  if (!session || !(session as any).user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const role = (session as any)?.user?.role as string | undefined
  
  // Only SUPER_ADMIN and ADMIN can view pending approvals
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'TENANT_ADMIN') {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  try {
    // Query for team members with PENDING status
    const pendingMembers = await prisma.$queryRaw<any[]>`
      SELECT 
        tm.id,
        tm.event_id as "eventId",
        e.name as "eventName",
        tm.name,
        tm.email,
        tm.role,
        tm.status,
        tm.invited_at as "invitedAt",
        tm.invited_by as "invitedBy"
      FROM event_team_members tm
      LEFT JOIN events e ON e.id = tm.event_id
      WHERE tm.status = 'PENDING'
      ORDER BY tm.invited_at DESC
      LIMIT 100
    `

    return NextResponse.json({
      members: pendingMembers.map(m => ({
        id: String(m.id),
        eventId: String(m.eventId),
        eventName: m.eventName || `Event ${m.eventId}`,
        name: m.name || 'Unknown',
        email: m.email,
        role: m.role,
        invitedAt: m.invitedAt,
        invitedBy: m.invitedBy || 'Unknown'
      }))
    })
  } catch (e: any) {
    console.error('Failed to load pending approvals:', e)
    return NextResponse.json({ message: e?.message || 'Failed to load' }, { status: 500 })
  }
}
