import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Query registrations directly with raw SQL to bypass middleware
        const registrations = await prisma.$queryRaw`
      SELECT 
        id, 
        event_id as "eventId",
        tenant_id as "tenantId",
        email,
        status,
        type,
        created_at as "createdAt"
      FROM registrations
      WHERE event_id = ${BigInt(24)}
      ORDER BY created_at DESC
      LIMIT 10
    ` as any[]

        return NextResponse.json({
            success: true,
            count: registrations.length,
            registrations: registrations.map(r => ({
                id: r.id,
                eventId: r.eventId.toString(),
                tenantId: r.tenantId,
                email: r.email,
                status: r.status,
                type: r.type,
                createdAt: r.createdAt
            }))
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
