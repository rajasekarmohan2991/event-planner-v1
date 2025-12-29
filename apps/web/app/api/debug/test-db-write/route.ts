import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
    try {
        console.log('[TEST] Starting database write test...')

        // Try to create a simple floor plan
        const testFloorPlan = await prisma.floorPlan.create({
            data: {
                eventId: BigInt(24),
                name: 'TEST FLOOR PLAN - DELETE ME',
                layoutData: { test: true },
                canvasWidth: 1200,
                canvasHeight: 800,
                totalCapacity: 100
            }
        })

        console.log('[TEST] Floor plan created:', testFloorPlan.id)

        // Verify it was saved by reading it back
        const verify = await prisma.floorPlan.findUnique({
            where: { id: testFloorPlan.id }
        })

        console.log('[TEST] Verification read:', verify ? 'SUCCESS' : 'FAILED')

        return NextResponse.json({
            success: true,
            message: 'Database write test passed',
            floorPlanId: testFloorPlan.id,
            verified: !!verify
        })
    } catch (error: any) {
        console.error('[TEST] Database write test failed:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code,
            meta: error.meta
        }, { status: 500 })
    }
}
