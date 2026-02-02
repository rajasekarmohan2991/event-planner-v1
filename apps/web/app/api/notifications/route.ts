import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const userId = (session.user as any)?.id

    const offset = (page - 1) * limit

    // Get notifications for the user
    const whereCondition = unreadOnly 
      ? Prisma.sql`WHERE (user_id = ${userId} OR user_id IS NULL) AND read_at IS NULL`
      : Prisma.sql`WHERE (user_id = ${userId} OR user_id IS NULL)`

    const notifications = await prisma.$queryRaw`
      SELECT 
        id,
        title,
        message,
        type,
        data_json as "dataJson",
        user_id as "userId",
        read_at as "readAt",
        created_at as "createdAt"
      FROM notifications 
      ${whereCondition}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count
    const totalResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM notifications 
      ${whereCondition}
    `

    const total = (totalResult as any)[0]?.count || 0

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { title, message, type, userId, data } = await req.json()

    // Create notification
    const notification = await prisma.$queryRaw`
      INSERT INTO notifications (
        title, 
        message, 
        type, 
        user_id, 
        data_json, 
        created_at
      )
      VALUES (
        ${title}, 
        ${message}, 
        ${type}, 
        ${userId || null}, 
        ${JSON.stringify(data || {})}, 
        NOW()
      )
      RETURNING id, title, message, type, created_at as "createdAt"
    `

    return NextResponse.json({
      success: true,
      notification: (notification as any)[0]
    }, { status: 201 })

  } catch (error: any) {
    console.error('Notification creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
