import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const body = await req.json()
    const {
      type,
      trigger,
      scheduledFor,
      subject,
      message,
      htmlContent,
      recipientFilter,
    } = body

    if (!type || !scheduledFor || !message) {
      return NextResponse.json(
        { error: 'type, scheduledFor, and message are required' },
        { status: 400 }
      )
    }

    // Count recipients based on filter
    let recipientCount = 0
    if (recipientFilter?.includeRegistrations) {
      recipientCount += await prisma.registration.count({
        where: { eventId, email: { not: null } }
      })
    }
    if (recipientFilter?.includeRsvps) {
      recipientCount += await prisma.rSVP.count({
        where: { eventId, email: { not: null } }
      })
    }

    const notification = await prisma.scheduledNotification.create({
      data: {
        eventId,
        type,
        trigger: trigger || 'MANUAL',
        scheduledFor: new Date(scheduledFor),
        subject,
        message,
        htmlContent,
        recipientFilter,
        recipientCount,
        createdById: BigInt((session.user as any).id),
      },
    })

    return NextResponse.json(notification)
  } catch (error: any) {
    console.error('Schedule notification error:', error)
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
    const url = new URL(req.url)
    const status = url.searchParams.get('status')

    const where: any = { eventId }
    if (status) where.status = status

    const notifications = await prisma.scheduledNotification.findMany({
      where,
      orderBy: { scheduledFor: 'asc' },
      include: {
        _count: {
          select: { deliveries: true }
        }
      }
    })

    return NextResponse.json(notifications)
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
