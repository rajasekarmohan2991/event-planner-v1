import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT /api/admin/lookups/values/[id] - Update lookup value
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions as any)

        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const params = 'then' in context.params ? await context.params : context.params
        const valueId = params.id
        const body = await req.json()
        const { value, label, description, sortOrder, isActive, isDefault } = body

        // Validate required fields
        if (!value || !label) {
            return NextResponse.json({ error: 'Value and label are required' }, { status: 400 })
        }

        // If setting as default, unset other defaults in same category
        if (isDefault) {
            const current = await prisma.$queryRaw<any[]>`
        SELECT category_id FROM lookup_values WHERE id = ${valueId} LIMIT 1
      `

            if (current && current.length > 0) {
                await prisma.$executeRawUnsafe(`
          UPDATE lookup_values
          SET is_default = FALSE
          WHERE category_id = '${current[0].category_id}' AND id != '${valueId}'
        `)
            }
        }

        // Update the value
        await prisma.$executeRawUnsafe(`
      UPDATE lookup_values
      SET 
        value = '${value}',
        label = '${label}',
        description = ${description ? `'${description}'` : 'NULL'},
        sort_order = ${sortOrder || 0},
        is_active = ${isActive !== undefined ? isActive : true},
        is_default = ${isDefault || false},
        updated_at = NOW()
      WHERE id = '${valueId}'
    `)

        // Fetch updated value
        const updated = await prisma.$queryRaw<any[]>`
      SELECT * FROM lookup_values WHERE id = ${valueId} LIMIT 1
    `

        return NextResponse.json({
            success: true,
            message: 'Lookup value updated',
            value: updated[0]
        })

    } catch (error: any) {
        console.error('❌ Update error:', error)
        return NextResponse.json({
            error: 'Failed to update value',
            details: error.message
        }, { status: 500 })
    }
}

// DELETE /api/admin/lookups/values/[id] - Delete lookup value
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions as any)

        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const params = 'then' in context.params ? await context.params : context.params
        const valueId = params.id

        // Check if system value
        const value = await prisma.$queryRaw<any[]>`
      SELECT id, label, is_system FROM lookup_values WHERE id = ${valueId} LIMIT 1
    `

        if (!value || value.length === 0) {
            return NextResponse.json({ error: 'Lookup value not found' }, { status: 404 })
        }

        if (value[0].is_system) {
            return NextResponse.json({
                error: 'Cannot delete system values',
                message: 'System values are protected. You can deactivate them instead.'
            }, { status: 403 })
        }

        // Delete the value
        await prisma.$executeRawUnsafe(`
      DELETE FROM lookup_values WHERE id = '${valueId}'
    `)

        return NextResponse.json({
            success: true,
            message: `${value[0].label} deleted successfully`
        })

    } catch (error: any) {
        console.error('❌ Delete error:', error)
        return NextResponse.json({
            error: 'Failed to delete value',
            details: error.message
        }, { status: 500 })
    }
}
