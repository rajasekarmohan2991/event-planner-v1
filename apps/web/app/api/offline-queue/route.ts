import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/offline-queue - Get pending queue items
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')

    const where: any = { status: 'pending' }
    if (eventId) where.eventId = BigInt(eventId)
    if (session?.user) where.userId = BigInt((session as any).user.id)

    const queue = await prisma.offlineQueue.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ queue })
  } catch (error: any) {
    console.error('Error fetching queue:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch queue',
      message: error.message
    }, { status: 500 })
  }
}

// POST /api/offline-queue - Add to queue
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    const body = await req.json()
    const { eventId, action, data, idempotencyKey } = body

    const queueItem = await prisma.offlineQueue.create({
      data: {
        eventId: BigInt(eventId),
        userId: session?.user ? BigInt((session as any).user.id) : null,
        action,
        data,
        idempotencyKey,
        status: 'pending'
      }
    })

    return NextResponse.json({ queueItem })
  } catch (error: any) {
    console.error('Error adding to queue:', error)
    return NextResponse.json({ 
      error: 'Failed to add to queue',
      message: error.message
    }, { status: 500 })
  }
}

// DELETE /api/offline-queue - Remove from queue
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const idempotencyKey = searchParams.get('idempotencyKey')

    if (!idempotencyKey) {
      return NextResponse.json({ error: 'idempotencyKey required' }, { status: 400 })
    }

    await prisma.offlineQueue.delete({
      where: { idempotencyKey }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing from queue:', error)
    return NextResponse.json({ 
      error: 'Failed to remove from queue',
      message: error.message
    }, { status: 500 })
  }
}
