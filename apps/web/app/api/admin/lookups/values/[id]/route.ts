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

        if (!session || (session as any).user?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const params = 'then' in context.params ? await context.params : context.params
        const valueId = params.id
        const body = await req.json()
        const { value, label, description, sortOrder, isActive } = body

        // Validate required fields
        if (!value || !label) {
            return NextResponse.json({ error: 'Value and label are required' }, { status: 400 })
        }

        // Update the value
        const updated = await prisma.lookup.update({
            where: { id: valueId },
            data: {
                code: value, // Map value from form to code in DB
                label,
                description: description || null,
                sortOrder: sortOrder || 0,
                isActive: isActive !== undefined ? isActive : true,
                // isDefault not supported in schema, usually handled by metadata if needed
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Lookup value updated',
            value: updated
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

        if (!session || (session as any).user?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const params = 'then' in context.params ? await context.params : context.params
        const valueId = params.id

        // Check if value exists
        const value = await prisma.lookup.findUnique({
            where: { id: valueId }
        })

        if (!value) {
            return NextResponse.json({ error: 'Lookup value not found' }, { status: 404 })
        }

        if (value.isSystem) {
            return NextResponse.json({ error: 'System values cannot be deleted' }, { status: 400 })
        }

        // Delete the value
        await prisma.lookup.delete({
            where: { id: valueId }
        })

        return NextResponse.json({
            success: true,
            message: `${value.label} deleted successfully`
        })

    } catch (error: any) {
        console.error('❌ Delete error:', error)
        return NextResponse.json({
            error: 'Failed to delete value',
            details: error.message
        }, { status: 500 })
    }
}
