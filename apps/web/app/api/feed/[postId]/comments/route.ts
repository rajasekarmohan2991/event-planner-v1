import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

// GET - Fetch comments for a post
export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId } = params

    const comments = await prisma.feedComment.findMany({
      where: { postId },
      include: {
        user: {
          select: { name: true, image: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    const serialized = comments.map((c) => ({
      id: c.id,
      userId: c.userId.toString(),
      userName: c.user?.name || 'User',
      userImage: c.user?.image || null,
      content: c.content,
      createdAt: c.createdAt
    }))

    return NextResponse.json({ comments: serialized })
  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST - Add comment to post
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
    const { content } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    await prisma.feedComment.create({
      data: {
        postId,
        userId,
        content
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Comment creation error:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
