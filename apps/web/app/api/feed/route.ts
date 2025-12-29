import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

async function ensureFeedTables() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS feed_posts (
        id TEXT PRIMARY KEY,
        "userId" BIGINT NOT NULL,
        "tenantId" VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        attachments JSONB,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_feed_posts_tenant ON feed_posts("tenantId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts("createdAt")`)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS feed_likes (
        id TEXT PRIMARY KEY,
        "postId" TEXT NOT NULL,
        "userId" BIGINT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE ("postId", "userId")
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON feed_likes("postId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_feed_likes_user ON feed_likes("userId")`)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS feed_comments (
        id TEXT PRIMARY KEY,
        "postId" TEXT NOT NULL,
        "userId" BIGINT NOT NULL,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_comments("postId")`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_feed_comments_user ON feed_comments("userId")`)
  } catch { }
}

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
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_user_notifications_created ON user_notifications("createdAt")`)
  } catch { }
}

// GET - Fetch feed posts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureFeedTables()

    const userId = BigInt(session.user.id)
    const userRole = (session.user as any).role

    // Fetch posts using Prisma Client
    // 1. Determine tenant filter
    let whereClause: any = {}
    if (userRole !== 'SUPER_ADMIN') {
      // Prefer currentTenantId on user; fallback to X-Tenant header if available
      const headerTenant = getTenantId()
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { currentTenantId: true } })
      const tenant = user?.currentTenantId || headerTenant

      // If user has a tenant, filter by it
      // If no tenant, show all posts (global feed for regular users)
      if (tenant) {
        whereClause.tenantId = tenant
      }
      // If no tenant, don't filter - show all posts
    }

    // 2. Fetch posts with relations
    const postsData = await prisma.feedPost.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        likes: {
          where: {
            userId: userId
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    // 3. Transform data to match expected format
    const serializedPosts = postsData.map(post => ({
      id: post.id,
      userId: post.userId.toString(),
      userName: post.user.name,
      userImage: post.user.image,
      content: post.content,
      attachments: post.attachments,
      createdAt: post.createdAt,
      likes: post._count.likes,
      comments: post._count.comments,
      isLiked: post.likes.length > 0
    }))

    return NextResponse.json({ posts: serializedPosts })
  } catch (error) {
    console.error('Feed fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
  }
}

// POST - Create new post
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureFeedTables()

    const userId = BigInt(session.user.id)
    const userRole = (session.user as any).role
    const formData = await req.formData()
    const content = formData.get('content') as string
    const attachments: string[] = []

    // Handle file uploads (simplified - in production, upload to S3/CloudStorage)
    const files = formData.getAll('attachments') as File[]
    for (const file of files) {
      // In production: upload to cloud storage and get URL
      // For now, we'll store a placeholder
      attachments.push(`/uploads/${file.name}`)
    }

    // Resolve tenant: user.currentTenantId -> header -> global for all users
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { currentTenantId: true, name: true } })
    let tenantId = user?.currentTenantId || getTenantId() || 'global'

    // Create post using Prisma Client instead of raw SQL to ensure type safety and correct column mapping
    const post = await prisma.feedPost.create({
      data: {
        userId: userId,
        tenantId: tenantId,
        content: content,
        attachments: attachments,
      }
    })

    // Create a simple self-notification so the bell shows something immediately
    await ensureUserNotificationsTable()
    const notifId = (globalThis as any).crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    await prisma.$executeRaw`
      INSERT INTO user_notifications (id, "userId", type, title, message, link, "isRead", "createdAt")
      VALUES (${notifId}, ${userId}, 'info', 'Post published', ${Prisma.sql`'Your post has been published'`}, ${`/feed`}, FALSE, NOW())
    `

    return NextResponse.json({
      success: true, post: {
        ...post,
        userId: post.userId.toString() // Serialize BigInt
      }
    })
  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
