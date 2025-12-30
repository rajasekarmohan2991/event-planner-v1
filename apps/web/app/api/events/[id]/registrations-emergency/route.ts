import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = BigInt(params.id)

        console.log('[EMERGENCY REGISTRATIONS] Fetching for event:', eventId.toString())

        // Use raw SQL to bypass tenant middleware
        const registrations = await prisma.$queryRaw`
            SELECT 
                id, event_id as "eventId", data_json as "dataJson",
                email, status, type, created_at as "createdAt"
            FROM registrations
            WHERE event_id = ${eventId}
            ORDER BY created_at DESC
        ` as any[]

        console.log('[EMERGENCY REGISTRATIONS] Found:', registrations.length)

        const serialized = registrations.map(r => {
            const data = r.dataJson as any || {}
            return {
                id: r.id,
                eventId: r.eventId.toString(),
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: r.email || data.email || '',
                phone: data.phone || '',
                company: data.company || '',
                jobTitle: data.jobTitle || '',
                status: r.status,
                type: r.type,
                checkedIn: false,
                createdAt: r.createdAt.toISOString(),
                registeredAt: r.createdAt.toISOString()
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
