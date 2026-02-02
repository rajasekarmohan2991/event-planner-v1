import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Debug endpoint to check EventRoleAssignment table
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const eventId = params.id

        console.log('🔍 DEBUG: Checking EventRoleAssignment for event:', eventId)

        // Query 1: Check all assignments for this event (no type casting)
        const query1 = await prisma.$queryRaw`
      SELECT 
        id,
        "eventId",
        "userId",
        role,
        "createdAt"
      FROM "EventRoleAssignment"
      WHERE "eventId" = ${eventId}
    ` as any[]

        console.log('Query 1 (direct match):', query1.length, 'results')

        // Query 2: Check with CAST
        const query2 = await prisma.$queryRaw`
      SELECT 
        id,
        "eventId",
        "userId",
        role,
        "createdAt"
      FROM "EventRoleAssignment"
      WHERE CAST("eventId" AS TEXT) = ${eventId}
    ` as any[]

        console.log('Query 2 (CAST):', query2.length, 'results')

        // Query 3: Get ALL assignments (to see what eventIds exist)
        const allAssignments = await prisma.$queryRaw`
      SELECT 
        id,
        "eventId",
        "userId",
        role,
        "createdAt"
      FROM "EventRoleAssignment"
      LIMIT 10
    ` as any[]

        console.log('All assignments sample:', allAssignments.length, 'results')

        // Query 4: Check users table
        const users = await prisma.$queryRaw`
      SELECT id, email, name FROM users LIMIT 5
    ` as any[]

        return NextResponse.json({
            eventId,
            eventIdType: typeof eventId,
            query1Results: query1.length,
            query1Data: query1,
            query2Results: query2.length,
            query2Data: query2,
            allAssignmentsSample: allAssignments,
            usersSample: users,
            message: 'Check console logs for detailed output'
        })

    } catch (error: any) {
        console.error('Debug error:', error)
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
