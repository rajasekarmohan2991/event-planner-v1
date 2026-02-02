import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const body = await req.json()
    const { config, imageData } = body

    if (!config || !imageData) {
      return NextResponse.json({ error: 'Missing config or imageData' }, { status: 400 })
    }

    // Save banner to database
    const banner = await prisma.eventBanner.create({
      data: {
        eventId,
        name: config.eventName || 'Untitled Banner',
        config,
        imageData,
      },
    })

    return NextResponse.json({ success: true, id: banner.id })
  } catch (error: any) {
    console.error('Save banner error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id

    const banners = await prisma.eventBanner.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(banners)
  } catch (error: any) {
    console.error('Get banners error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
