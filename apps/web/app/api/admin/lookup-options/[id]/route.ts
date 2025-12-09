import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT /api/admin/lookup-options/[id] - Update lookup option
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session as any).user.role as string
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { optionValue, optionLabel, displayOrder, isActive, metadata } = body

    await prisma.$executeRaw`
      UPDATE lookup_options
      SET 
        option_value = COALESCE(${optionValue}, option_value),
        option_label = COALESCE(${optionLabel}, option_label),
        display_order = COALESCE(${displayOrder}, display_order),
        is_active = COALESCE(${isActive}, is_active),
        metadata = COALESCE(${metadata ? JSON.stringify(metadata) : null}::jsonb, metadata),
        updated_at = NOW()
      WHERE id = ${BigInt(params.id)}
    `

    const updated = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id::text,
        category,
        option_key as "optionKey",
        option_value as "optionValue",
        option_label as "optionLabel",
        display_order as "displayOrder",
        is_active as "isActive",
        metadata,
        updated_at as "updatedAt"
      FROM lookup_options
      WHERE id = $1
    `, BigInt(params.id))

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Lookup option not found' }, { status: 404 })
    }

    return NextResponse.json(updated[0])
  } catch (error: any) {
    console.error('Error updating lookup option:', error)
    return NextResponse.json({ 
      error: 'Failed to update lookup option',
      message: error.message
    }, { status: 500 })
  }
}

// DELETE /api/admin/lookup-options/[id] - Delete lookup option
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session as any).user.role as string
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.$executeRaw`
      DELETE FROM lookup_options
      WHERE id = ${BigInt(params.id)}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting lookup option:', error)
    return NextResponse.json({ 
      error: 'Failed to delete lookup option',
      message: error.message
    }, { status: 500 })
  }
}
