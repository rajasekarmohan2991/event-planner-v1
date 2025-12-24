import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const eventId = BigInt(params.id)
        const body = await req.json()

        console.log('[EMERGENCY CHECKIN] Event:', eventId.toString())
        console.log('[EMERGENCY CHECKIN] Body:', body)

        const registrationId = body.registrationId || body.id

        if (!registrationId) {
            return NextResponse.json({
                success: false,
                error: 'Registration ID required'
            }, { status: 400 })
        }

        console.log('[EMERGENCY CHECKIN] Looking for registration:', registrationId)

        // Find the registration
        const registration = await prisma.registration.findFirst({
            where: {
                id: registrationId,
                eventId
            }
        })

        if (!registration) {
            console.log('[EMERGENCY CHECKIN] Registration not found')
            return NextResponse.json({
                success: false,
                error: 'Registration not found'
            }, { status: 404 })
        }

        console.log('[EMERGENCY CHECKIN] Found registration, updating check-in status...')

        // Update check-in status
        const updated = await prisma.registration.update({
            where: { id: registrationId },
            data: {
                checkInStatus: 'CHECKED_IN',
                checkInTime: new Date()
            }
        })

        console.log('[EMERGENCY CHECKIN] Success! Checked in:', registrationId)

        // Extract attendee data from dataJson
        const data = updated.dataJson as any || {}

        return NextResponse.json({
            success: true,
            attendee: {
                id: updated.id,
                firstName: data.firstName || 'Guest',
                lastName: data.lastName || '',
                email: updated.email || data.email || '',
                phone: data.phone || '',
                type: updated.type,
                status: updated.status,
                checkInStatus: updated.checkInStatus,
                checkInTime: updated.checkInTime?.toISOString()
            }
        })
    } catch (error: any) {
        console.error('[EMERGENCY CHECKIN] Error:', error.message)
        console.error('[EMERGENCY CHECKIN] Stack:', error.stack?.split('\n').slice(0, 5))
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
