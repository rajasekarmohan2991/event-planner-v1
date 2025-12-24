import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma, { safeJson } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const eventId = params.id
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {
        const groups = await prisma.ticketGroup.findMany({
            where: { eventId: String(eventId) },
            orderBy: { createdAt: 'asc' }
        })

        return NextResponse.json(safeJson(groups))
    } catch (e: any) {
        console.error('Error fetching ticket groups:', e)
        return NextResponse.json({ message: 'Failed to load ticket groups', error: e?.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const eventId = params.id
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {
        const { name } = await req.json()
        if (!name || !name.trim()) {
            return NextResponse.json({ message: 'Name is required' }, { status: 400 })
        }

        const group = await prisma.ticketGroup.create({
            data: {
                eventId: String(eventId),
                name: name.trim()
            }
        })

        return NextResponse.json(safeJson(group))
    } catch (e: any) {
        console.error('Error creating ticket group:', e)
        return NextResponse.json({ message: 'Failed to create ticket group', error: e?.message }, { status: 500 })
    }
}
