
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

    // EventRoleAssignment columns (from probe): id, eventId, userId, role, siteId, createdAt, tenantId
    // These are camelCase WITHOUT quotes in the actual database
    const assignments = await prisma.$queryRaw`
      SELECT 
        a.id, 
        a."userId", 
        a.role, 
        a."createdAt",
        u.name, 
        u.email, 
        u.image
      FROM "EventRoleAssignment" a
      LEFT JOIN users u ON a."userId"::text = u.id::text
      WHERE a."eventId"::bigint = ${eventIdBigInt}
      ORDER BY a."createdAt" DESC
    ` as any[]

    console.log(`✅ Found ${assignments.length} assignments for event ${eventId}`)

    const items = assignments.map((a: any) => ({
      id: a.id,
      userId: a.userId ? String(a.userId) : null,
      name: a.name || 'Unknown User',
      email: a.email || 'unknown@example.com',
      role: a.role || 'STAFF',
      status: 'JOINED',
      imageUrl: a.image || null,
      joinedAt: a.createdAt,
      progress: 100
    }))

    return NextResponse.json({
      items,
      total: items.length,
      totalPages: 1,
      page: 1,
      limit: items.length
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
