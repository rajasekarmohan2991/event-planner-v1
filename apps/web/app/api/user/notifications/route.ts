import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/user/notifications - Create notification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = BigInt((session as any).user.id)
    const body = await req.json()
    const { type, title, message, link } = body

    const notification = await prisma.userNotification.create({
      data: {
        userId,
        type: type || 'info',
        title,
        message,
        link,
        isRead: false,
        isArchived: false,
      }
    })

    const serialized = {
      ...notification,
      userId: notification.userId.toString(),
      createdAt: notification.createdAt,
      readAt: notification.readAt
    }

    return NextResponse.json({ notification: serialized })
  } catch (error: any) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ 
      error: 'Failed to create notification',
      message: error.message
    }, { status: 500 })
  }
}

// GET /api/user/notifications - Get user notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = BigInt((session as any).user.id)
    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const notifications = await prisma.userNotification.findMany({
      where: {
        userId,
        isArchived: false,
        ...(unreadOnly ? { isRead: false } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    const serialized = notifications.map((n) => ({
      id: n.id,
      userId: String(n.userId),
      type: n.type || 'info',
      title: n.title || '',
      message: n.message || '',
      link: n.link || null,
      isRead: !!n.isRead,
      isArchived: !!n.isArchived,
      createdAt: n.createdAt,
      readAt: n.readAt || null,
    }))

    return NextResponse.json({ notifications: serialized })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch notifications',
      message: error.message
    }, { status: 500 })
  }
}

// PATCH /api/user/notifications - Mark as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = BigInt((session as any).user.id)
    const body = await req.json()
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      await prisma.userNotification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
    } else if (notificationId) {
      await prisma.userNotification.updateMany({
        where: {
          id: notificationId,
          userId // Security: ensure user owns the notification
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ 
      error: 'Failed to update notification',
      message: error.message
    }, { status: 500 })
  }
}
