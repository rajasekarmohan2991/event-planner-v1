import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Test endpoint to verify seat generation works
 * GET /api/events/[id]/seats/test
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions as any) as any
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const eventId = parseInt(params.id)

        console.log('[TEST] Testing seat generation for event:', eventId)

        // Check if event exists
        const event = await prisma.$queryRaw`
      SELECT id, name, status FROM events WHERE id = ${eventId} LIMIT 1
    ` as any[]

        if (event.length === 0) {
            return NextResponse.json({
                error: 'Event not found',
                eventId
            }, { status: 404 })
        }

        console.log('[TEST] Event found:', event[0])

        // Check existing seats
        const existingSeats = await prisma.seatInventory.count({
            where: { eventId: BigInt(eventId) }
        })

        console.log('[TEST] Existing seats:', existingSeats)

        // Check floor plan config
        const floorPlanConfigs = await prisma.floorPlanConfig.findMany({
            where: { eventId: BigInt(eventId) }
        })

        console.log('[TEST] Floor plan configs:', floorPlanConfigs.length)

        // Try to create a test seat
        let testSeatCreated = false
        let testSeatError = null

        try {
            const testSeat = await prisma.seatInventory.create({
                data: {
                    eventId: BigInt(eventId),
                    section: 'TEST',
                    rowNumber: 'T1',
                    seatNumber: '1',
                    seatType: 'TEST',
                    basePrice: 100,
                    xCoordinate: 0,
                    yCoordinate: 0,
                    isAvailable: true,
                    tenantId: session.user.currentTenantId || null
                }
            })

            testSeatCreated = true

            // Clean up test seat
            await prisma.seatInventory.delete({
                where: { id: testSeat.id }
            })

            console.log('[TEST] ✅ Test seat created and deleted successfully')
        } catch (error: any) {
            testSeatError = error.message
            console.error('[TEST] ❌ Failed to create test seat:', error)
        }

        return NextResponse.json({
            success: true,
            event: {
                id: event[0].id,
                name: event[0].name,
                status: event[0].status
            },
            existingSeats,
            floorPlanConfigs: floorPlanConfigs.length,
            testSeatCreated,
            testSeatError,
            message: testSeatCreated
                ? '✅ Seat generation is working correctly'
                : `⚠️ Seat creation failed: ${testSeatError}`,
            user: {
                email: session.user.email,
                tenantId: session.user.currentTenantId
            }
        })

    } catch (error: any) {
        console.error('[TEST] Error:', error)
        return NextResponse.json({
            error: 'Test failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 })
    }
}
