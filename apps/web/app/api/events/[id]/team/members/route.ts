
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Helper to serialize BigInt
const bigIntReplacer = (key: string, value: any) =>
  typeof value === 'bigint' ? value.toString() : value

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    // if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const eventId = params.id  // Keep as STRING - EventRoleAssignment.eventId is String type
    console.log('🔍 [TEAM MEMBERS] Event ID:', eventId, 'Type:', typeof eventId)

    // Strategy 1: Direct query
    console.log('🔍 [TEAM MEMBERS] Trying direct query...')
    let assignments = await prisma.$queryRaw`
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
      LEFT JOIN users u ON a."userId"::text = u.id::text
      WHERE a."eventId" = ${eventId}
      ORDER BY a."createdAt" DESC
    ` as any[]

    console.log(`✅ [TEAM MEMBERS] Strategy 1 found: ${assignments.length} members`)

    // If no results, try to see ALL assignments to debug
    if (assignments.length === 0) {
      console.log('⚠️ [TEAM MEMBERS] No results! Checking all assignments...')
      const allAssignments = await prisma.$queryRaw`
        SELECT "eventId", COUNT(*) as count
        FROM "EventRoleAssignment"
        GROUP BY "eventId"
        LIMIT 10
      ` as any[]
      console.log('📊 [TEAM MEMBERS] All eventIds in database:', JSON.stringify(allAssignments))

      // Try with type casting
      console.log('🔍 [TEAM MEMBERS] Trying with CAST...')
      assignments = await prisma.$queryRaw`
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
        LEFT JOIN users u ON a."userId"::text = u.id::text
        WHERE CAST(a."eventId" AS TEXT) = ${eventId}
        ORDER BY a."createdAt" DESC
      ` as any[]
      console.log(`✅ [TEAM MEMBERS] Strategy 2 (CAST) found: ${assignments.length} members`)
    }

    if (assignments.length > 0) {
      console.log('📋 [TEAM MEMBERS] Sample:', JSON.stringify(assignments[0], (key, value) => typeof value === 'bigint' ? value.toString() : value))
    } else {
      console.log('❌ [TEAM MEMBERS] Still no results after all strategies!')
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
    console.error('❌ Error fetching team members:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      eventId: params.id
    })
    return NextResponse.json({
      message: 'Failed to load team members',
      error: error.message,
      details: error.code
    }, { status: 500 })
  }
}
