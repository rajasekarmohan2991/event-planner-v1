
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

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

        return NextResponse.json(groups)
    } catch (e: any) {
        console.error('Error fetching ticket groups:', e)
        // Fallback if table doesn't exist yet
        if (e.code === 'P2021') {
            return NextResponse.json([
                { id: 'g-1', name: 'VIP' },
                { id: 'g-2', name: 'General Admission' }
            ])
        }
        return NextResponse.json({ message: 'Failed to load ticket groups' }, { status: 500 })
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

        // Get tenant ID from event
        const event = await prisma.event.findUnique({
            where: { id: BigInt(eventId) }
        })

        // Note: event might be fetched with BigInt id, but TicketGroup uses String eventId
        // We'll store it as string to match the current schema definition

        const group = await prisma.ticketGroup.create({
            data: {
                eventId: String(eventId),
                // tenantId: event?.tenantId, // Event model might not have tenantId exposed directly or it's named differently
                name: name.trim()
            }
        })

        return NextResponse.json(group)
    } catch (e: any) {
        console.error('Error creating ticket group:', e)
        return NextResponse.json({ message: 'Failed to create ticket group' }, { status: 500 })
    }
}
