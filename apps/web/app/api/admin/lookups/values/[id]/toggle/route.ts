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

        // Get current value
        const current = await prisma.$queryRaw<any[]>`
      SELECT id, value, label, is_active, is_system
      FROM lookup_values
      WHERE id = ${valueId}
      LIMIT 1
    `

        if (!current || current.length === 0) {
            return NextResponse.json({ error: 'Lookup value not found' }, { status: 404 })
        }

        const currentValue = current[0]
        const newActiveState = !currentValue.is_active

        // Update the active state
        await prisma.$executeRaw`
            UPDATE lookup_values
            SET is_active = ${newActiveState}, updated_at = NOW()
            WHERE id = ${valueId}
        `

        return NextResponse.json({
            success: true,
            message: `${currentValue.label} ${newActiveState ? 'activated' : 'deactivated'}`,
            value: {
                id: valueId,
                label: currentValue.label,
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
