import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const eventId = BigInt(params.id)
        const result = await prisma.$queryRaw`
      SELECT promote_data as "promoteData" FROM events WHERE id = ${eventId}
    ` as any[]

        return NextResponse.json(result[0]?.promoteData || {})
    } catch (e: any) {
        return NextResponse.json({}, { status: 200 }) // Return empty if fails or column doesn't exist yet
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    try {
        const body = await req.json()
        const eventId = BigInt(params.id)

        await prisma.$executeRawUnsafe(`
      UPDATE events 
      SET promote_data = $1::jsonb
      WHERE id = $2
    `, JSON.stringify(body), Number(eventId)) // Casting eventId to Number for unsafe or try param handling

        // Note: $executeRaw variables
        // Using simple substitution for safety if parameters supported, else use literal with care
        // Prisma $executeRaw supports parameters:

        await prisma.$executeRaw`UPDATE events SET promote_data = ${JSON.stringify(body)}::jsonb WHERE id = ${eventId}`

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('Save promote settings failed:', e)
        return NextResponse.json({ message: 'Save failed' }, { status: 500 })
    }
}
