import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Ensure event_feed_posts table exists
async function ensureEventFeedTable() {
    try {
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS event_feed_posts (
        id BIGSERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        tenant_id VARCHAR(255),
        user_id VARCHAR(255),
        author_name VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_event_feed_posts_event_id ON event_feed_posts(event_id)`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_event_feed_posts_created_at ON event_feed_posts(created_at DESC)`)
    } catch (e) {
        console.error('Error ensuring event_feed_posts table:', e)
    }
}


// GET - Fetch feed posts for an event
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await ensureEventFeedTable()

        const session = await getServerSession(authOptions) as any
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const eventId = BigInt(params.id)

        // Fetch posts from database
        const posts = await prisma.$queryRaw`
      SELECT 
        id::text,
        message,
        author_name as "authorName",
        created_at as "createdAt"
      FROM event_feed_posts
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
      LIMIT 50
    ` as any[]

        const formattedPosts = posts.map(p => ({
            id: p.id,
            message: p.message,
            author: p.authorName || 'Anonymous',
            createdAt: p.createdAt
        }))

        return NextResponse.json({ posts: formattedPosts })

    } catch (error: any) {
        console.error('GET feed error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create a new feed post
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await ensureEventFeedTable()

        const session = await getServerSession(authOptions) as any
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { message } = body

        if (!message || !message.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        const eventId = BigInt(params.id)
        const userId = session.user.id
        const authorName = session.user.name || session.user.email || 'Anonymous'

        // Get event's tenant
        const events = await prisma.$queryRaw`
      SELECT tenant_id as "tenantId" FROM events WHERE id = ${eventId} LIMIT 1
    ` as any[]

        if (!events.length) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        const tenantId = events[0].tenantId

        // Create the post
        const result = await prisma.$queryRaw`
      INSERT INTO event_feed_posts (
        event_id, tenant_id, user_id, author_name, message, created_at, updated_at
      ) VALUES (
        ${eventId}, ${tenantId}, ${userId}, ${authorName}, ${message.trim()}, NOW(), NOW()
      )
      RETURNING id::text, message, author_name as "authorName", created_at as "createdAt"
    ` as any[]

        const newPost = result[0]

        return NextResponse.json({
            post: {
                id: newPost.id,
                message: newPost.message,
                author: newPost.authorName,
                createdAt: newPost.createdAt
            }
        }, { status: 201 })

    } catch (error: any) {
        console.error('POST feed error:', error)
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
    }
}
