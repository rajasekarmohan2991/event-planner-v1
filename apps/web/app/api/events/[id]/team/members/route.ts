
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
    console.log('📡 Fetching team members for event:', eventId, '(type: string)')

    // EventRoleAssignment.eventId is String type, so query with string directly
    const assignments = await prisma.$queryRaw`
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

    console.log(`✅ Found ${assignments.length} team members for event ${eventId}`)
    if (assignments.length > 0) {
      console.log('📋 Sample assignment:', JSON.stringify(assignments[0], (key, value) => typeof value === 'bigint' ? value.toString() : value))
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
