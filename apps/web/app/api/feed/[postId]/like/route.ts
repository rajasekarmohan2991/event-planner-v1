import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = BigInt(session.user.id)
    const { postId } = params

    // Check if already liked (composite unique exists on [postId, userId])
    const existing = await prisma.feedLike.findUnique({
      where: { postId_userId: { postId, userId } },
      select: { id: true }
    })

    if (existing) {
      // Unlike
      await prisma.feedLike.delete({
        where: { postId_userId: { postId, userId } }
      })
      return NextResponse.json({ liked: false })
    }
    
    // Like
    await prisma.feedLike.create({
      data: { postId, userId }
    })
    return NextResponse.json({ liked: true })
  } catch (error) {
    console.error('Like toggle error:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
