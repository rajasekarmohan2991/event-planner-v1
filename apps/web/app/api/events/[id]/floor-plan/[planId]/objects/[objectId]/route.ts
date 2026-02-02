import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT - Update an object
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string; planId: string; objectId: string } }
) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { planId, objectId } = params
        const body = await req.json()

        console.log('📐 Updating object:', objectId)

        // Check if object exists
        const existing = await (prisma as any).floorPlanObject?.findUnique({
            where: { id: objectId }
        })

        if (!existing) {
            return NextResponse.json({ message: 'Object not found' }, { status: 404 })
        }

        // Update object
        const object = await (prisma as any).floorPlanObject.update({
            where: { id: objectId },
            data: {
                type: body.type !== undefined ? body.type : existing.type,
                subType: body.subType !== undefined ? body.subType : existing.subType,
                x: body.x !== undefined ? body.x : existing.x,
                y: body.y !== undefined ? body.y : existing.y,
                width: body.width !== undefined ? body.width : existing.width,
                height: body.height !== undefined ? body.height : existing.height,
                rotation: body.rotation !== undefined ? body.rotation : existing.rotation,
                rows: body.rows !== undefined ? body.rows : existing.rows,
                cols: body.cols !== undefined ? body.cols : existing.cols,
                seatsPerRow: body.seatsPerRow !== undefined ? body.seatsPerRow : existing.seatsPerRow,
                totalSeats: body.totalSeats !== undefined ? body.totalSeats : existing.totalSeats,
                pricingTier: body.pricingTier !== undefined ? body.pricingTier : existing.pricingTier,
                pricePerSeat: body.pricePerSeat !== undefined ? body.pricePerSeat : existing.pricePerSeat,
                gender: body.gender !== undefined ? body.gender : existing.gender,
                fillColor: body.fillColor !== undefined ? body.fillColor : existing.fillColor,
                strokeColor: body.strokeColor !== undefined ? body.strokeColor : existing.strokeColor,
                opacity: body.opacity !== undefined ? body.opacity : existing.opacity,
                label: body.label !== undefined ? body.label : existing.label,
                metadata: body.metadata !== undefined ? body.metadata : existing.metadata
            }
        })

        // Update floor plan capacity
        await updateFloorPlanCapacity(planId)

        console.log('✅ Object updated:', object.id)

        return NextResponse.json({
            message: 'Object updated successfully',
            object
        })
    } catch (error: any) {
        console.error('❌ Error updating object:', error)
        return NextResponse.json({
            message: 'Failed to update object',
            error: error.message
        }, { status: 500 })
    }
}

// DELETE - Delete an object
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; planId: string; objectId: string } }
) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { planId, objectId } = params
        console.log('📐 Deleting object:', objectId)

        // Check if object exists
        const existing = await (prisma as any).floorPlanObject?.findUnique({
            where: { id: objectId }
        })

        if (!existing) {
            return NextResponse.json({ message: 'Object not found' }, { status: 404 })
        }

        // Delete object
        await (prisma as any).floorPlanObject.delete({
            where: { id: objectId }
        })

        // Update floor plan capacity
        await updateFloorPlanCapacity(planId)

        console.log('✅ Object deleted:', objectId)

        return NextResponse.json({
            message: 'Object deleted successfully'
        })
    } catch (error: any) {
        console.error('❌ Error deleting object:', error)
        return NextResponse.json({
            message: 'Failed to delete object',
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
