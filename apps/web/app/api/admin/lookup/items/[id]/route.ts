import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT /api/admin/lookup/items/[id] - Update lookup item
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is SUPER_ADMIN
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden - Super Admin only' }, { status: 403 })
    }

    const body = await req.json()
    const { value, label, description, sortOrder, isActive, isDefault } = body

    // If setting as default, unset other defaults in the same group
    if (isDefault) {
      const currentItem = await prisma.lookupOption.findUnique({
        where: { id: params.id },
        select: { groupId: true }
      })

      if (currentItem) {
        await prisma.lookupOption.updateMany({
          where: { 
            groupId: currentItem.groupId,
            id: { not: params.id }
          },
          data: { isDefault: false }
        })
      }
    }

    const item = await prisma.lookupOption.update({
      where: { id: params.id },
      data: {
        value,
        label,
        description,
        sortOrder,
        isActive,
        isDefault,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ item, message: 'Lookup item updated successfully' })
  } catch (error: any) {
    console.error('Failed to update lookup item:', error)
    return NextResponse.json(
      { message: error?.message || 'Failed to update item' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/lookup/items/[id] - Delete lookup item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is SUPER_ADMIN
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden - Super Admin only' }, { status: 403 })
    }

    // Check if item is system-protected
    const item = await prisma.lookupOption.findUnique({
      where: { id: params.id },
    })

    if (!item) {
      return NextResponse.json({ message: 'Lookup item not found' }, { status: 404 })
    }

    if (item.isSystem) {
      return NextResponse.json(
        { message: 'Cannot delete system-protected lookup item' },
        { status: 403 }
      )
    }

    await prisma.lookupOption.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Lookup item deleted successfully' })
  } catch (error: any) {
    console.error('Failed to delete lookup item:', error)
    return NextResponse.json(
      { message: error?.message || 'Failed to delete item' },
      { status: 500 }
    )
  }
}
