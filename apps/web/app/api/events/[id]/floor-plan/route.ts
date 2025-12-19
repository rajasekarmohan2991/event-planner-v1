import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List all floor plans for an event
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const eventId = params.id
        console.log('📐 Fetching floor plans for event:', eventId)

        // Fetch floor plans with safe type casting
        const floorPlans = await (prisma as any).floorPlan?.findMany({
            where: { eventId },
            include: {
                objects: true
            },
            orderBy: { createdAt: 'desc' }
        }) || []

        console.log(`✅ Found ${floorPlans.length} floor plans`)

        return NextResponse.json({
            floorPlans,
            total: floorPlans.length
        })
    } catch (error: any) {
        console.error('❌ Error fetching floor plans:', error)
        return NextResponse.json({
            message: 'Failed to load floor plans',
            error: error.message,
            details: 'FloorPlan model may not be available. Please run: npx prisma generate'
        }, { status: 500 })
    }
}

// POST - Create a new floor plan
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const eventId = params.id
        const body = await req.json()
        const tenantId = (session as any)?.user?.currentTenantId || null

        console.log('📐 Creating floor plan for event:', eventId)

        // Validate event exists
        const event = await prisma.event.findFirst({
            where: { id: BigInt(eventId) }
        })

        if (!event) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 })
        }

        // Create floor plan with safe type casting
        const floorPlan = await (prisma as any).floorPlan.create({
            data: {
                eventId,
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
                layoutData: body.layoutData || null,
                status: body.status || 'DRAFT',
                version: 1,
                tenantId
            }
        })

        console.log('✅ Floor plan created:', floorPlan.id)

        return NextResponse.json({
            message: 'Floor plan created successfully',
            floorPlan
        }, { status: 201 })
    } catch (error: any) {
        console.error('❌ Error creating floor plan:', error)
        return NextResponse.json({
            message: 'Failed to create floor plan',
            error: error.message
        }, { status: 500 })
    }
}
