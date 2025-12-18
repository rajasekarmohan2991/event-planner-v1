import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Create Test Event for SUPER_ADMIN
 * POST /api/admin/create-test-event
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions as any) as any

        if (!session || session.user?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Create a test event
        const testEvent = await prisma.event.create({
            data: {
                name: 'Test Event - ' + new Date().toISOString(),
                description: 'This is a test event created for debugging purposes',
                startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                endsAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
                status: 'PUBLISHED',
                eventMode: 'HYBRID',
                venue: 'Test Venue',
                city: 'Mumbai',
                address: '123 Test Street',
                priceInr: 0,
                expectedAttendees: 100,
                category: 'CONFERENCE',
                tenantId: session.user?.currentTenantId || null,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Test event created successfully',
            event: {
                ...testEvent,
                id: String(testEvent.id)
            }
        })
    } catch (error: any) {
        console.error('Error creating test event:', error)
        return NextResponse.json({
            error: error.message,
            message: 'Failed to create test event'
        }, { status: 500 })
    }
}
