
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
    console.log('🔍 [TEAM MEMBERS] Fetching for event:', eventId)

    // Simple, direct query - no complex joins or casting
    let assignments: any[] = []

    try {
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

      console.log(`✅ [TEAM MEMBERS] Found ${assignments.length} members`)
    } catch (queryError: any) {
      console.error('❌ [TEAM MEMBERS] Query failed:', queryError.message)

      // If table doesn't exist, return empty
      if (queryError.code === '42P01') {
        console.log('⚠️ [TEAM MEMBERS] EventRoleAssignment table does not exist')
        return NextResponse.json({
          items: [],
          total: 0,
          totalPages: 0,
          page: 1,
          limit: 100,
          message: 'Team members table not found. Please run database migrations.'
        })
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

    return NextResponse.json({
      items,
      total: items.length,
      totalPages: 1,
      page: 1,
      limit: 100
    })

  } catch (error: any) {
    console.error('❌ [TEAM MEMBERS] Error:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack?.split('\n').slice(0, 3)
    })

    return NextResponse.json({
      message: 'Failed to load team members',
      error: error.message,
      code: error.code,
      hint: 'Check server logs for details'
    }, { status: 500 })
  }
}
