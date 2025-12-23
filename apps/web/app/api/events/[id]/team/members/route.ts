
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

    const eventId = params.id
    const timestamp = new Date().toISOString()
    console.log(`🔍 [TEAM MEMBERS ${timestamp}] Fetching for event:`, eventId)

    // FORCE NO CACHE
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }

    let assignments: any[] = []

    try {
      // Query with explicit no-cache
      assignments = await prisma.$queryRawUnsafe(`
        SELECT 
          a.id, 
          a."eventId", 
          a."userId", 
          a.role, 
          a."createdAt",
          u.name, 
          u.email, 
          u.image,
          u.password_hash as "hasPassword"
        FROM "EventRoleAssignment" a
        LEFT JOIN users u ON a."userId" = u.id
        WHERE a."eventId" = $1
        ORDER BY a."createdAt" DESC
      `, eventId)

      console.log(`✅ [TEAM MEMBERS ${timestamp}] Found ${assignments.length} members`)

      if (assignments.length > 0) {
        console.log(`📋 [TEAM MEMBERS ${timestamp}] First member:`, {
          id: assignments[0].id,
          eventId: assignments[0].eventId,
          userId: assignments[0].userId,
          email: assignments[0].email,
          role: assignments[0].role
        })
      } else {
        console.log(`⚠️ [TEAM MEMBERS ${timestamp}] NO MEMBERS FOUND for eventId: ${eventId}`)

        // Debug: Check if ANY assignments exist
        const allAssignments = await prisma.$queryRawUnsafe(`
          SELECT "eventId", COUNT(*) as count
          FROM "EventRoleAssignment"
          GROUP BY "eventId"
          LIMIT 5
        `)
        console.log(`📊 [TEAM MEMBERS ${timestamp}] All eventIds in DB:`, allAssignments)
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

    const items = assignments.map((a: any) => ({
      id: String(a.id),
      userId: a.userId ? String(a.userId) : null,
      name: a.name || a.email?.split('@')[0] || 'Unknown User',
      email: a.email || 'unknown@example.com',
      role: a.role || 'STAFF',
      status: a.hasPassword ? 'JOINED' : 'INVITED',
      imageUrl: a.image || null,
      invitedAt: a.createdAt,
      joinedAt: a.hasPassword ? a.createdAt : null,
      progress: a.hasPassword ? 100 : 25
    }))

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
