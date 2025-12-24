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

        console.log('[EMERGENCY REG CREATE] Event:', eventId.toString())
        console.log('[EMERGENCY REG CREATE] Data:', JSON.stringify(body).substring(0, 200))

        const formData = body.data || body

        // Create registration using the actual schema
        const registration = await prisma.registration.create({
            data: {
                eventId,
                email: formData.email,
                status: 'APPROVED', // Use valid enum value
                type: body.type || 'GENERAL',
                dataJson: formData, // Store all form data in JSON field
                approvalMode: 'AUTOMATIC'
            }
        })

        console.log('[EMERGENCY REG CREATE] Success! ID:', registration.id)

        return NextResponse.json({
            success: true,
            id: registration.id,
            message: 'Registration created successfully'
        }, { status: 201 })
    } catch (error: any) {
        console.error('[EMERGENCY REG CREATE] Error:', error.message)
        console.error('[EMERGENCY REG CREATE] Stack:', error.stack?.split('\n').slice(0, 5))
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
