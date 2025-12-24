import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = BigInt(params.id)

        console.log('[EMERGENCY REGISTRATIONS] Fetching for event:', eventId.toString())

        const registrations = await prisma.registration.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' }
        })

        console.log('[EMERGENCY REGISTRATIONS] Found:', registrations.length)

        const serialized = registrations.map(r => {
            const data = r.dataJson as any || {}
            return {
                id: r.id,
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: r.email || data.email || '',
                phone: data.phone || '',
                status: r.status,
                type: r.type,
                createdAt: r.createdAt.toISOString(),
                eventId: r.eventId.toString()
            }
        })

        return NextResponse.json({
            success: true,
            registrations: serialized,
            pagination: {
                page: 0,
                size: serialized.length,
                total: serialized.length,
                totalPages: 1
            }
        })
    } catch (error: any) {
        console.error('[EMERGENCY REGISTRATIONS] Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            registrations: []
        }, { status: 500 })
    }
}
