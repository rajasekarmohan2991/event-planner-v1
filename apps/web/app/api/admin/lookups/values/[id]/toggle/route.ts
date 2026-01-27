import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH /api/admin/lookups/values/[id]/toggle - Toggle active/inactive
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions as any)

        if (!session || (session as any).user?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const params = 'then' in context.params ? await context.params : context.params
        const valueId = params.id

        // Get current value to toggle
        const current = await prisma.lookup.findUnique({
            where: { id: valueId }
        })

        if (!current) {
            return NextResponse.json({ error: 'Lookup value not found' }, { status: 404 })
        }

        const newActiveState = !current.isActive

        // Update the active state
        const updated = await prisma.lookup.update({
            where: { id: valueId },
            data: { isActive: newActiveState }
        })

        return NextResponse.json({
            success: true,
            message: `${updated.label} ${newActiveState ? 'activated' : 'deactivated'}`,
            value: {
                id: updated.id,
                label: updated.label,
                isActive: updated.isActive
            }
        })

    } catch (error: any) {
        console.error('❌ Toggle error:', error)
        return NextResponse.json({
            error: 'Failed to toggle value',
            details: error.message
        }, { status: 500 })
    }
}
