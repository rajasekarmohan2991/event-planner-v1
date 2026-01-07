
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    // if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const eventIdStr = params.id
    const eventId = BigInt(eventIdStr)
    const timestamp = new Date().toISOString()
    console.log(`🔍 [TEAM MEMBERS ${timestamp}] Fetching for event:`, eventIdStr)

    // FORCE NO CACHE
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }

    let assignments: any[] = []
    let invitations: any[] = []

    try {
      // Query accepted members from EventRoleAssignment
      // Use tagged template for proper BigInt handling
      assignments = await prisma.$queryRaw`
        SELECT 
          a.id, 
          a."eventId", 
          a."userId", 
          a.role, 
          a."createdAt",
          COALESCE(u.name, '') as name, 
          COALESCE(u.email, '') as email, 
          COALESCE(u.image, '') as image,
          CASE WHEN u.password_hash IS NOT NULL THEN true ELSE false END as "hasPassword",
          'JOINED' as source
        FROM "EventRoleAssignment" a
        LEFT JOIN users u ON a."userId" = u.id
        WHERE a."eventId" = ${eventId}
        ORDER BY a."createdAt" DESC
      ` as any[]

      console.log(`✅ [TEAM MEMBERS ${timestamp}] Found ${assignments.length} accepted members`)

      // Query pending invitations from event_team_invitations
      try {
        invitations = await prisma.$queryRaw`
          SELECT 
            id,
            event_id as "eventId",
            email,
            role,
            status,
            created_at as "createdAt",
            'INVITED' as source
          FROM event_team_invitations
          WHERE event_id = ${eventId} AND status = 'PENDING'
          ORDER BY created_at DESC
        ` as any[]

        console.log(`✅ [TEAM MEMBERS ${timestamp}] Found ${invitations.length} pending invitations`)
      } catch (inviteError: any) {
        console.log(`⚠️ [TEAM MEMBERS ${timestamp}] Could not fetch invitations (table may not exist):`, inviteError.message)
        invitations = []
      }

      const totalCount = assignments.length + invitations.length
      console.log(`📊 [TEAM MEMBERS ${timestamp}] Total: ${totalCount} (${assignments.length} joined + ${invitations.length} invited)`)

      if (totalCount === 0) {
        console.log(`⚠️ [TEAM MEMBERS ${timestamp}] NO MEMBERS OR INVITATIONS FOUND for eventId: ${eventId}`)
      }

    } catch (queryError: any) {
      console.error(`❌ [TEAM MEMBERS ${timestamp}] Query failed:`, queryError.message)

      if (queryError.code === '42P01') {
        console.log(`⚠️ [TEAM MEMBERS ${timestamp}] EventRoleAssignment table does not exist`)
        return NextResponse.json({
          items: [],
          total: 0,
          totalPages: 0,
          page: 1,
          limit: 100,
          message: 'Team members table not found. Please run database migrations.',
          timestamp
        }, { headers })
      }

      throw queryError
    }

    // Map accepted members
    const acceptedMembers = assignments.map((a: any) => ({
      id: String(a.id),
      userId: a.userId ? String(a.userId) : null,
      name: a.name || a.email?.split('@')[0] || 'Unknown User',
      email: a.email || 'unknown@example.com',
      role: a.role || 'STAFF',
      status: 'JOINED',
      imageUrl: a.image || null,
      invitedAt: a.createdAt,
      joinedAt: a.createdAt,
      progress: 100,
      source: 'assignment'
    }))

    // Map pending invitations
    const pendingInvites = invitations.map((inv: any) => ({
      id: String(inv.id),
      userId: null,
      name: inv.email?.split('@')[0] || 'Invited User',
      email: inv.email || 'unknown@example.com',
      role: inv.role || 'STAFF',
      status: 'INVITED',
      imageUrl: null,
      invitedAt: inv.createdAt,
      joinedAt: null,
      progress: 25,
      source: 'invitation'
    }))

    // Combine both lists
    const items = [...acceptedMembers, ...pendingInvites]

    console.log(`✅ [TEAM MEMBERS ${timestamp}] Returning ${items.length} items`)

    return NextResponse.json({
      items,
      total: items.length,
      totalPages: 1,
      page: 1,
      limit: 100,
      timestamp,
      debug: {
        eventId,
        queryExecutedAt: timestamp,
        rawCount: assignments.length,
        mappedCount: items.length
      }
    }, { headers })

  } catch (error: any) {
    const timestamp = new Date().toISOString()
    console.error(`❌ [TEAM MEMBERS ${timestamp}] Error:`, {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack?.split('\n').slice(0, 3)
    })

    return NextResponse.json({
      message: 'Failed to load team members',
      error: error.message,
      code: error.code,
      hint: 'Check server logs for details',
      timestamp
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}
