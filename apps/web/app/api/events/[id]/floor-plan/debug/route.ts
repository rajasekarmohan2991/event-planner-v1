import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const diagnostics: any = {
        step: 'start',
        timestamp: new Date().toISOString()
    }

    try {
        const params = await context.params
        const id = params.id
        diagnostics.eventId = id
        diagnostics.step = 'params_parsed'

        const session = await getServerSession(authOptions as any)
        diagnostics.hasSession = !!session
        diagnostics.step = 'session_checked'

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized', diagnostics }, { status: 401 })
        }

        const eventId = BigInt(id)
        diagnostics.eventIdBigInt = eventId.toString()
        diagnostics.step = 'bigint_created'

        const body = await req.json()
        diagnostics.bodyKeys = Object.keys(body)
        diagnostics.step = 'body_parsed'

        // Test database connection
        try {
            const event = await prisma.event.findFirst({
                where: { id: eventId },
                select: { id: true, tenantId: true }
            })
            diagnostics.eventFound = !!event
            diagnostics.eventData = event ? { id: event.id.toString(), tenantId: event.tenantId } : null
            diagnostics.step = 'event_fetched'
        } catch (dbError: any) {
            diagnostics.dbError = {
                message: dbError.message,
                code: dbError.code,
                name: dbError.name
            }
            diagnostics.step = 'db_error'
        }

        // Test floor plan creation
        try {
            const testData = {
                eventId: eventId,
                tenantId: null,
                name: 'Debug Test',
                canvasWidth: 1200,
                canvasHeight: 800,
                backgroundColor: '#ffffff',
                gridSize: 20,
                vipPrice: 0,
                premiumPrice: 0,
                generalPrice: 0,
                totalCapacity: 0,
                vipCapacity: 0,
                premiumCapacity: 0,
                generalCapacity: 0,
                menCapacity: 0,
                womenCapacity: 0,
                layoutData: {},
                status: 'DRAFT'
            }

            diagnostics.testDataPrepared = true
            diagnostics.step = 'test_data_prepared'

            const newFloorPlan = await prisma.floorPlan.create({
                data: testData
            })

            diagnostics.floorPlanCreated = true
            diagnostics.floorPlanId = newFloorPlan.id
            diagnostics.step = 'floor_plan_created'

            // Test serialization
            const serialized = {
                id: newFloorPlan.id,
                eventId: newFloorPlan.eventId.toString(),
                vipPrice: String(newFloorPlan.vipPrice)
            }
            diagnostics.serialized = serialized
            diagnostics.step = 'serialization_success'

        } catch (createError: any) {
            diagnostics.createError = {
                message: createError.message,
                code: createError.code,
                name: createError.name,
                stack: createError.stack?.split('\n').slice(0, 3)
            }
            diagnostics.step = 'create_error'
        }

        return NextResponse.json({
            success: true,
            diagnostics
        })

    } catch (error: any) {
        diagnostics.fatalError = {
            message: error.message,
            code: error.code,
            name: error.name,
            stack: error.stack?.split('\n').slice(0, 5)
        }
        diagnostics.step = 'fatal_error'

        return NextResponse.json({
            success: false,
            diagnostics
        }, { status: 500 })
    }
}
