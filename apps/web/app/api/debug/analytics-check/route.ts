import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const registrationsCount = await prisma.registration.count();
        const registrationsByStatus = await prisma.registration.groupBy({
            by: ['status'],
            _count: true,
            _sum: {
                priceInr: true
            }
        });

        const events = await prisma.event.findMany({
            take: 5,
            select: {
                id: true,
                name: true,
                tenantId: true,
                registrations: {
                    take: 5,
                    select: {
                        id: true,
                        status: true,
                        priceInr: true
                    }
                }
            }
        })

        const rsvpCount = await prisma.rSVP.count();

        return NextResponse.json({
            registrationsCount,
            registrationsByStatus,
            rsvpCount,
            events
        }, { status: 200 })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
