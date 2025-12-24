import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const eventId = BigInt(params.id)

        const plans = await prisma.floorPlan.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' }
        })

        const serialized = plans.map(p => ({
            id: p.id,
            name: p.name,
            eventId: p.eventId.toString(),
            createdAt: p.createdAt.toISOString(),
            status: p.status,
            totalCapacity: p.totalCapacity,
            vipCapacity: p.vipCapacity,
            premiumCapacity: p.premiumCapacity,
            generalCapacity: p.generalCapacity
        }))

        return NextResponse.json({
            success: true,
            count: serialized.length,
            floorPlans: serialized
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
