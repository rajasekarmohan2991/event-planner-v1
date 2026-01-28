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

        // Use Raw SQL to find and toggle on lookup_options table
        // This avoids mismatch with Prisma schema models
        const current = await prisma.$queryRawUnsafe<any[]>(
            `SELECT id, label, is_active FROM lookup_options WHERE id = $1`,
            valueId
        )

        if (!current || current.length === 0) {
            return NextResponse.json({ error: 'Lookup value not found' }, { status: 404 })
        }

        const record = current[0]
        const newActiveState = !record.is_active

        // Update the active state
        await prisma.$executeRawUnsafe(
            `UPDATE lookup_options SET is_active = $1 WHERE id = $2`,
            newActiveState,
            valueId
        )

        return NextResponse.json({
            success: true,
            message: `${record.label} ${newActiveState ? 'activated' : 'deactivated'}`,
            value: {
                id: record.id,
                label: record.label,
                isActive: newActiveState
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
