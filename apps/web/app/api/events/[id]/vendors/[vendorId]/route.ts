import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; vendorId: string } }
) {
    const session = await getServerSession(authOptions as any)
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const eventId = params.id
        const vendorId = params.vendorId

        // Delete the vendor
        await prisma.$executeRawUnsafe(
            `DELETE FROM event_vendors WHERE id = $1 AND event_id = $2`,
            vendorId,
            eventId
        )

        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        console.error('Error deleting vendor:', error)
        return NextResponse.json(
            { message: 'Failed to delete vendor', error: error.message },
            { status: 500 }
        )
    }
}
