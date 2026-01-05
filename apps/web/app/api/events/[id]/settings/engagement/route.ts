import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const eventId = BigInt(params.id)
        const result = await prisma.$queryRaw`
      SELECT engagement_data as "engagementData" FROM events WHERE id = ${eventId}
    ` as any[]

        return NextResponse.json(result[0]?.engagementData || {})
    } catch (e: any) {
        return NextResponse.json({}, { status: 200 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

    try {
        const body = await req.json()
        const eventId = BigInt(params.id)

        await prisma.$executeRaw`UPDATE events SET engagement_data = ${JSON.stringify(body)}::jsonb WHERE id = ${eventId}`

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('Save engagement settings failed:', e)
        return NextResponse.json({ message: 'Save failed' }, { status: 500 })
    }
}
