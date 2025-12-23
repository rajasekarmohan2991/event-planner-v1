
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

    const eventId = params.id
    const eventIdBigInt = BigInt(eventId)
    console.log('📡 Fetching team members for event (RAW SQL):', eventId)
    console.log('🔍 Event ID type:', typeof eventId, 'Value:', eventId)

    // Try multiple query strategies to find assignments
    let assignments: any[] = []

    // Strategy 1: Direct string comparison
    try {
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
        WHERE a."eventId" = ${eventId}
        ORDER BY a."createdAt" DESC
      ` as any[]

      console.log(`✅ Strategy 1 (string): Found ${assignments.length} assignments`)
    } catch (e1) {
      console.log('❌ Strategy 1 failed:', e1)
    }

    // Strategy 2: If no results, try with CAST
    if (assignments.length === 0) {
      try {
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

        console.log(`✅ Strategy 2 (CAST): Found ${assignments.length} assignments`)
      } catch (e2) {
        console.log('❌ Strategy 2 failed:', e2)
      }
    }

    console.log(`✅ Final result: Found ${assignments.length} assignments for event ${eventId}`)
    console.log('📋 Raw assignments:', JSON.stringify(assignments.slice(0, 2), (key, value) => typeof value === 'bigint' ? value.toString() : value, 2))

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
