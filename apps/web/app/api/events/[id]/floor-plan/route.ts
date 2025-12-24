import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { ensureSchema } from '@/lib/ensure-schema'

export const dynamic = 'force-dynamic'

// Production schema: eventId is BIGINT (camelCase, unquoted)

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params
        const id = params.id
        console.log('🔍 [FloorPlan GET] Fetching for event:', id)

        const session = await getServerSession(authOptions as any) as any
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const eventId = BigInt(id)

        // Use Prisma FindMany instead of Raw SQL (Safer)
        const floorPlans = await prisma.floorPlan.findMany({
            where: {
                eventId: eventId
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        console.log(`✅ [FloorPlan GET] Found ${floorPlans.length} plans`)

        // Start mapping serialization
        const serialized = floorPlans.map(fp => ({
            ...fp,
            // Ensure BigInts are strings
            eventId: fp.eventId.toString(),
            // Ensure JSON is parsed if needed (Prisma does it auto, but ensuring objects array exists)
            objects: (fp.layoutData as any)?.objects || []
        }))

        return NextResponse.json({
            floorPlans: serialized,
            total: serialized.length
        })

    } catch (error: any) {
        console.error('❌ [FloorPlan GET] Error:', error)
        return NextResponse.json({
            message: 'Failed to load floor plans',
            error: error.message
        }, { status: 500 })
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params
        const id = params.id

        // DEBUG: Force 200 OK to verify routing
        // Remove this later
        console.log('📌 [FloorPlan POST] HIT DEBUG CHECK')
        /* 
        // Uncomment to verify routing if 404 persists
        return NextResponse.json({ 
            message: 'DEBUG: Route is reachable!',
            eventId: id 
        }, { status: 200 }) 
        */

        console.log('📌 [FloorPlan POST] Creating for event:', id)

        const session = await getServerSession(authOptions as any) as any
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const eventId = BigInt(id)
        const body = await req.json()

        // 1. Get Event (optional check, better debugging)
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { tenantId: true }
        })

        if (!event) {
            console.error('❌ [FloorPlan POST] Event not found for ID:', id)
            // Changing 404 to 400 to distinguish from "Route Not Found"
            return NextResponse.json({ message: `Event ${id} not found in DB` }, { status: 400 })
        }

        console.log('✅ [FloorPlan POST] Event found, creating plan...')

        // 2. Create Floor Plan using Prisma Client
        const newFloorPlan = await prisma.floorPlan.create({
            data: {
                eventId: eventId,
                tenantId: event.tenantId,
                name: body.name || 'New Floor Plan',
                description: body.description || null,
                canvasWidth: body.canvasWidth || 1200,
                canvasHeight: body.canvasHeight || 800,
                backgroundColor: body.backgroundColor || '#ffffff',
                gridSize: body.gridSize || 20,
                vipPrice: body.vipPrice || 0,
                premiumPrice: body.premiumPrice || 0,
                generalPrice: body.generalPrice || 0,
                totalCapacity: body.totalCapacity || 0,
                vipCapacity: body.vipCapacity || 0,
                premiumCapacity: body.premiumCapacity || 0,
                generalCapacity: body.generalCapacity || 0,
                menCapacity: body.menCapacity || 0,
                womenCapacity: body.womenCapacity || 0,
                layoutData: body.layoutData || {},
                status: body.status || 'DRAFT'
            }
        })

        console.log('✅ [FloorPlan POST] Success:', newFloorPlan.id)

        const responseData = {
            ...newFloorPlan,
            id: newFloorPlan.id,
            eventId: id,
        }

        return NextResponse.json({
            message: 'Floor plan created successfully',
            floorPlan: responseData
        }, { status: 201 })

    } catch (error: any) {
        console.error('❌ [FloorPlan POST] Error:', error)
        return NextResponse.json({
            message: 'Failed to create floor plan',
            error: error.message
        }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params
        const id = params.id
        console.log('📌 [FloorPlan PUT] Updating event:', id)

        const session = await getServerSession(authOptions as any) as any
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        console.log('📌 [FloorPlan PUT] Plan ID:', body.id)

        if (!body.id) {
            return NextResponse.json({ message: 'Floor plan ID is required' }, { status: 400 })
        }

        const updatedFloorPlan = await prisma.floorPlan.update({
            where: { id: body.id },
            data: {
                name: body.name,
                description: body.description,
                canvasWidth: body.canvasWidth,
                canvasHeight: body.canvasHeight,
                backgroundColor: body.backgroundColor,
                gridSize: body.gridSize,
                vipPrice: body.vipPrice,
                premiumPrice: body.premiumPrice,
                generalPrice: body.generalPrice,
                totalCapacity: body.totalCapacity,
                vipCapacity: body.vipCapacity,
                premiumCapacity: body.premiumCapacity,
                generalCapacity: body.generalCapacity,
                menCapacity: body.menCapacity,
                womenCapacity: body.womenCapacity,
                layoutData: body.layoutData,
                status: body.status,
                version: { increment: 1 }
            }
        })

        const responseData = {
            ...updatedFloorPlan,
            eventId: id
        }

        console.log('✅ [FloorPlan PUT] Success:', body.id)

        return NextResponse.json({
            message: 'Floor plan updated successfully',
            floorPlan: responseData
        })
    } catch (error: any) {
        console.error('❌ [FloorPlan PUT] Error:', error)
        return NextResponse.json({
            message: 'Failed to update floor plan',
            error: error.message
        }, { status: 500 })
    }
}
