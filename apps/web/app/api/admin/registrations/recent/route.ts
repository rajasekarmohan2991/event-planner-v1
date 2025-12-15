import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check authorization - only SUPER_ADMIN, ADMIN, and EVENT_MANAGER
    const userRole = (session as any).user.role as string
    if (!['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch recent registrations with event details
    const recentRegistrations = await prisma.$queryRaw`
      SELECT 
        r.id::text,
        e.name as "eventTitle",
        COALESCE((r.data_json->>'name')::text, 'Unknown User') as "userName",
        r.type as "status",
        r.created_at as "createdAt"
      FROM registrations r
      LEFT JOIN events e ON r.event_id = e.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `

    return NextResponse.json({ 
      data: recentRegistrations || []
    })

  } catch (error: any) {
    console.error('Error fetching recent registrations:', error)
    
    // Return empty array on error
    return NextResponse.json({ data: [] })
  }
}
