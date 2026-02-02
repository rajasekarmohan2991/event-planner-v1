import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const notificationId = parseInt(params.id)
    const userId = (session.user as any)?.id

    // Mark notification as read
    const updated = await prisma.$queryRaw`
      UPDATE notifications 
      SET read_at = NOW()
      WHERE id = ${notificationId} 
        AND (user_id = ${userId} OR user_id IS NULL)
        AND read_at IS NULL
      RETURNING id, read_at as "readAt"
    `

    if (!(updated as any)[0]) {
      return NextResponse.json({ error: 'Notification not found or already read' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      notification: (updated as any)[0]
    })

  } catch (error: any) {
    console.error('Mark notification read error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
