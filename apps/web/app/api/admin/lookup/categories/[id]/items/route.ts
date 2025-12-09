import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const items = await prisma.lookupOption.findMany({
      where: {
        groupId: params.id,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ items })
  } catch (error: any) {
    console.error('Failed to fetch lookup items:', error)
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const { value, label, description, sortOrder, isDefault } = body

    if (!value || !label) {
      return NextResponse.json(
        { message: 'Value and label are required' },
        { status: 400 }
      )
    }

    const item = await prisma.lookupOption.create({
      data: {
        groupId: params.id,
        value,
        label,
        description,
        sortOrder: sortOrder || 0,
        isActive: true,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({ item })
  } catch (error: any) {
    console.error('Failed to create lookup item:', error)
    return NextResponse.json(
      { message: error?.message || 'Failed to create item' },
      { status: 500 }
    )
  }
}
