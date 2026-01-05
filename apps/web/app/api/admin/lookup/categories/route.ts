import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is SUPER_ADMIN
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden - Super Admin only' }, { status: 403 })
    }

    const categories = await prisma.lookupGroup.findMany({
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { label: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Failed to fetch lookup categories:', error)
    return NextResponse.json(
      { message: error?.message || 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, label, description } = body

    if (!name || !label) {
      return NextResponse.json(
        { message: 'Name and label are required' },
        { status: 400 }
      )
    }

    const category = await prisma.lookupGroup.create({
      data: {
        name,
        label,
        description,
        isActive: true,
      },
    })

    return NextResponse.json({ category })
  } catch (error: any) {
    console.error('Failed to create lookup category:', error)
    return NextResponse.json(
      { message: error?.message || 'Failed to create category' },
      { status: 500 }
    )
  }
}
