import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List all objects in a floor plan
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string; planId: string } }
) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { planId } = params
        console.log('📐 Fetching objects for floor plan:', planId)

        // Fetch objects with safe type casting
        const objects = await (prisma as any).floorPlanObject?.findMany({
            where: { floorPlanId: planId },
            orderBy: { createdAt: 'asc' }
        }) || []

        console.log(`✅ Found ${objects.length} objects`)

        return NextResponse.json({
            objects,
            total: objects.length
        })
    } catch (error: any) {
        console.error('❌ Error fetching objects:', error)
        return NextResponse.json({
            message: 'Failed to load objects',
            error: error.message
        }, { status: 500 })
    }
}

// POST - Add a new object to floor plan
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string; planId: string } }
) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { planId } = params
        const body = await req.json()

        console.log('📐 Adding object to floor plan:', planId)

        // Validate floor plan exists
        const floorPlan = await (prisma as any).floorPlan?.findUnique({
            where: { id: planId }
        })

        if (!floorPlan) {
            return NextResponse.json({ message: 'Floor plan not found' }, { status: 404 })
        }

        // Create object
        const object = await (prisma as any).floorPlanObject.create({
            data: {
                floorPlanId: planId,
                type: body.type,
                subType: body.subType || null,
                x: body.x || 0,
                y: body.y || 0,
                width: body.width || 100,
                height: body.height || 100,
                rotation: body.rotation || 0,
                rows: body.rows || null,
                cols: body.cols || null,
                seatsPerRow: body.seatsPerRow || null,
                totalSeats: body.totalSeats || 0,
                pricingTier: body.pricingTier || null,
                pricePerSeat: body.pricePerSeat || null,
                gender: body.gender || null,
                fillColor: body.fillColor || '#3b82f6',
                strokeColor: body.strokeColor || '#1e40af',
                opacity: body.opacity || 1.0,
                label: body.label || null,
                metadata: body.metadata || null
            }
        })

        // Update floor plan capacity
        await updateFloorPlanCapacity(planId)

        console.log('✅ Object added:', object.id)

        return NextResponse.json({
            message: 'Object added successfully',
            object
        }, { status: 201 })
    } catch (error: any) {
        console.error('❌ Error adding object:', error)
        return NextResponse.json({
            message: 'Failed to add object',
            error: error.message
        }, { status: 500 })
    }
}

// Helper function to update floor plan capacity
async function updateFloorPlanCapacity(planId: string) {
    try {
        // Get all objects
        const objects = await (prisma as any).floorPlanObject?.findMany({
            where: { floorPlanId: planId }
        }) || []

        // Calculate totals
        let totalCapacity = 0
        let vipCapacity = 0
        let premiumCapacity = 0
        let generalCapacity = 0
        let menCapacity = 0
        let womenCapacity = 0

        objects.forEach((obj: any) => {
            const seats = obj.totalSeats || 0
            totalCapacity += seats

            // By pricing tier
            if (obj.pricingTier === 'VIP') vipCapacity += seats
            else if (obj.pricingTier === 'PREMIUM') premiumCapacity += seats
            else if (obj.pricingTier === 'GENERAL') generalCapacity += seats

            // By gender
            if (obj.gender === 'MEN') menCapacity += seats
            else if (obj.gender === 'WOMEN') womenCapacity += seats
        })

        // Update floor plan
        await (prisma as any).floorPlan.update({
            where: { id: planId },
            data: {
                totalCapacity,
                vipCapacity,
                premiumCapacity,
                generalCapacity,
                menCapacity,
                womenCapacity
            }
        })

        console.log('✅ Floor plan capacity updated')
    } catch (error) {
        console.error('❌ Error updating capacity:', error)
    }
}
