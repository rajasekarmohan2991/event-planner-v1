import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; bannerId: string } }
) {
    try {
        const session = await getServerSession(authOptions as any) as any
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: eventId, bannerId } = params

        // Verify ownership or permissions if needed
        // For now assuming if they can access the event route, they can delete (auth checked above)

        await prisma.eventBanner.delete({
            where: {
                id: bannerId,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete banner error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
