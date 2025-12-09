import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function ensureUserNotificationsTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id TEXT PRIMARY KEY,
        "userId" BIGINT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        title TEXT,
        message TEXT,
        link TEXT,
        "isRead" BOOLEAN DEFAULT FALSE,
        "isArchived" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "readAt" TIMESTAMP NULL
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications("userId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications("isRead")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON user_notifications("createdAt")`)
  } catch {}
}

// GET /api/user/notifications - Get user notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUserNotificationsTable()

    const userId = BigInt((session as any).user.id)
    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const baseSql = `
      SELECT 
        id,
        "userId",
        type,
        title,
        message,
        link,
        "isRead",
        "isArchived",
        "createdAt",
        "readAt"
      FROM user_notifications
      WHERE "userId" = ${userId}
        AND ("isArchived" = FALSE)
        ${unreadOnly ? 'AND "isRead" = FALSE' : ''}
      ORDER BY "createdAt" DESC
      LIMIT 50`
    const notifications = await prisma.$queryRawUnsafe(baseSql)

    const serialized = (notifications || []).map((n) => ({
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

// POST /api/user/notifications - Create notification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUserNotificationsTable()

    const userId = BigInt((session as any).user.id)
    const body = await req.json()
    const { type, title, message, link } = body

    const id = (globalThis as any).crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const rows = await prisma.$queryRaw<any[]>`
      INSERT INTO user_notifications (id, "userId", type, title, message, link, "isRead", "isArchived", "createdAt")
      VALUES (${id}, ${userId}, ${type}, ${title}, ${message}, ${link}, FALSE, FALSE, NOW())
      RETURNING id, "userId", type, title, message, link, "isRead", "createdAt"
    `

    const n = rows[0]
    const serialized = {
      id: n.id,
      userId: String(n.userId),
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.link,
      isRead: !!n.isRead,
      createdAt: n.createdAt,
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

// PATCH /api/user/notifications - Mark as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUserNotificationsTable()

    const userId = BigInt((session as any).user.id)
    const body = await req.json()
    const { notificationId, markAllAsRead } = body

    if (markAllAsRead) {
      await prisma.$executeRaw`
        UPDATE user_notifications
        SET "isRead" = TRUE, "readAt" = NOW()
        WHERE "userId" = ${userId} AND "isRead" = FALSE
      `
    } else if (notificationId) {
      await prisma.$executeRaw`
        UPDATE user_notifications
        SET "isRead" = TRUE, "readAt" = NOW()
        WHERE id = ${notificationId} AND "userId" = ${userId}
      `
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
