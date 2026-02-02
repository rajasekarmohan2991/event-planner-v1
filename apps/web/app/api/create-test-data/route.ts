import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Create 3 test registrations
        const testRegs = []

        for (let i = 1; i <= 3; i++) {
            const reg = await prisma.registration.create({
                data: {
                    eventId: BigInt(22),
                    email: `demo${i}@example.com`,
                    status: 'APPROVED',
                    type: 'GENERAL',
                    dataJson: {
                        firstName: `Demo`,
                        lastName: `User ${i}`,
                        email: `demo${i}@example.com`,
                        phone: `123456789${i}`,
                        gender: i % 2 === 0 ? 'Female' : 'Male'
                    },
                    approvalMode: 'AUTOMATIC'
                }
            })
            testRegs.push(reg)
        }

        // Get all registrations for Event 22
        const allRegs = await prisma.registration.findMany({
            where: { eventId: BigInt(22) },
            orderBy: { createdAt: 'desc' }
        })

        const serialized = allRegs.map(r => {
            const data = r.dataJson as any || {}
            return {
                id: r.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: r.email,
                phone: data.phone,
                status: r.status,
                type: r.type,
                createdAt: r.createdAt.toISOString()
            }
        })

        return NextResponse.json({
            success: true,
            message: `Created ${testRegs.length} test registrations`,
            registrations: serialized,
            total: serialized.length
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
