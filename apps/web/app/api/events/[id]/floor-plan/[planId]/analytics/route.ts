import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get analytics for a floor plan
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
        console.log('📊 Fetching analytics for floor plan:', planId)

        // Fetch floor plan with objects
        const floorPlan = await (prisma as any).floorPlan?.findUnique({
            where: { id: planId },
            include: {
                objects: true,
                event: {
                    select: {
                        id: true,
                        name: true,
                        expectedAttendees: true
                    }
                }
            }
        })

        if (!floorPlan) {
            return NextResponse.json({ message: 'Floor plan not found' }, { status: 404 })
        }

        // Calculate detailed analytics
        const analytics = calculateAnalytics(floorPlan)

        console.log('✅ Analytics calculated')

        return NextResponse.json({ analytics })
    } catch (error: any) {
        console.error('❌ Error fetching analytics:', error)
        return NextResponse.json({
            message: 'Failed to load analytics',
            error: error.message
        }, { status: 500 })
    }
}

function calculateAnalytics(floorPlan: any) {
    const objects = floorPlan.objects || []

    // Capacity breakdown
    const capacity = {
        total: floorPlan.totalCapacity || 0,
        vip: floorPlan.vipCapacity || 0,
        premium: floorPlan.premiumCapacity || 0,
        general: floorPlan.generalCapacity || 0,
        men: floorPlan.menCapacity || 0,
        women: floorPlan.womenCapacity || 0
    }

    // Revenue potential
    const vipRevenue = capacity.vip * Number(floorPlan.vipPrice || 0)
    const premiumRevenue = capacity.premium * Number(floorPlan.premiumPrice || 0)
    const generalRevenue = capacity.general * Number(floorPlan.generalPrice || 0)
    const totalRevenue = vipRevenue + premiumRevenue + generalRevenue

    // Object type breakdown
    const objectTypes: Record<string, number> = {}
    const seatingTypes: Record<string, number> = {}

    objects.forEach((obj: any) => {
        // Count by type
        objectTypes[obj.type] = (objectTypes[obj.type] || 0) + 1

        // Count seating by subtype
        if (obj.type === 'GRID' || obj.type === 'ROUND_TABLE') {
            const key = obj.subType || obj.type
            seatingTypes[key] = (seatingTypes[key] || 0) + (obj.totalSeats || 0)
        }
    })

    // Utilization
    const expectedAttendees = floorPlan.event?.expectedAttendees || 0
    const utilization = expectedAttendees > 0
        ? Math.round((capacity.total / expectedAttendees) * 100)
        : 0

    // Gender split percentage
    const genderSplit = {
        men: capacity.total > 0 ? Math.round((capacity.men / capacity.total) * 100) : 0,
        women: capacity.total > 0 ? Math.round((capacity.women / capacity.total) * 100) : 0,
        mixed: capacity.total > 0 ? Math.round(((capacity.total - capacity.men - capacity.women) / capacity.total) * 100) : 0
    }

    // Pricing tier percentage
    const tierSplit = {
        vip: capacity.total > 0 ? Math.round((capacity.vip / capacity.total) * 100) : 0,
        premium: capacity.total > 0 ? Math.round((capacity.premium / capacity.total) * 100) : 0,
        general: capacity.total > 0 ? Math.round((capacity.general / capacity.total) * 100) : 0
    }

    return {
        capacity,
        revenue: {
            vip: vipRevenue,
            premium: premiumRevenue,
            general: generalRevenue,
            total: totalRevenue
        },
        pricing: {
            vip: Number(floorPlan.vipPrice || 0),
            premium: Number(floorPlan.premiumPrice || 0),
            general: Number(floorPlan.generalPrice || 0)
        },
        utilization: {
            capacity: capacity.total,
            expected: expectedAttendees,
            percentage: utilization,
            status: utilization >= 100 ? 'FULL' : utilization >= 80 ? 'HIGH' : utilization >= 50 ? 'MEDIUM' : 'LOW'
        },
        breakdown: {
            objectTypes,
            seatingTypes,
            genderSplit,
            tierSplit
        },
        summary: {
            totalObjects: objects.length,
            totalSeats: capacity.total,
            averageSeatsPerObject: objects.length > 0 ? Math.round(capacity.total / objects.length) : 0,
            revenuePerSeat: capacity.total > 0 ? Math.round(totalRevenue / capacity.total) : 0
        }
    }
}
