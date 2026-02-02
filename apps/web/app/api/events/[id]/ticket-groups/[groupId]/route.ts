
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest, { params }: { params: { id: string, groupId: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {
        // Check if group has tickets
        const ticketCount = await prisma.ticket.count({
            where: { groupId: params.groupId }
        })

        if (ticketCount > 0) {
            return NextResponse.json({
                message: `Cannot delete group with ${ticketCount} tickets. Please move or delete tickets first.`
            }, { status: 400 })
        }

        await prisma.ticketGroup.delete({
            where: { id: params.groupId }
        })

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error('Error deleting ticket group:', e)
        return NextResponse.json({ message: 'Failed to delete ticket group' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string, groupId: string } }) {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    try {
        const { name } = await req.json()

        const group = await prisma.ticketGroup.update({
            where: { id: params.groupId },
            data: { name: name.trim() }
        })

        return NextResponse.json(group)
    } catch (e: any) {
        console.error('Error updating ticket group:', e)
        return NextResponse.json({ message: 'Failed to update ticket group' }, { status: 500 })
    }
}
