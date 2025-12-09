import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { 
      rating, 
      feedback, 
      category,
      anonymous,
      recommendations,
      wouldRecommend,
      improvements 
    } = await req.json()

    const eventId = parseInt(params.id)
    const userId = (session.user as any)?.id

    // Create feedback entry
    const feedbackEntry = await prisma.$queryRaw`
      INSERT INTO event_feedback (
        event_id, 
        user_id, 
        rating, 
        feedback_text, 
        category, 
        anonymous, 
        recommendations, 
        would_recommend, 
        improvements,
        created_at
      )
      VALUES (
        ${eventId}, 
        ${anonymous ? null : userId}, 
        ${rating}, 
        ${feedback}, 
        ${category}, 
        ${anonymous}, 
        ${recommendations || ''}, 
        ${wouldRecommend}, 
        ${improvements || ''},
        NOW()
      )
      RETURNING id, created_at as "createdAt"
    `

    return NextResponse.json({
      success: true,
      feedback: (feedbackEntry as any)[0]
    }, { status: 201 })

  } catch (error: any) {
    console.error('Feedback submission error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')

    const eventId = parseInt(params.id)

    // Get feedback with optional category filter
    const feedback = await prisma.$queryRaw`
      SELECT 
        id,
        event_id as "eventId",
        user_id as "userId",
        rating,
        feedback_text as "feedbackText",
        category,
        anonymous,
        recommendations,
        would_recommend as "wouldRecommend",
        improvements,
        created_at as "createdAt"
      FROM event_feedback 
      WHERE event_id = ${eventId}
      ${category ? prisma.$queryRaw`AND category = ${category}` : prisma.$queryRaw``}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `

    // Get feedback statistics
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*)::int as total_feedback,
        AVG(rating)::numeric(3,2) as avg_rating,
        COUNT(CASE WHEN rating >= 4 THEN 1 END)::int as positive_feedback,
        COUNT(CASE WHEN rating <= 2 THEN 1 END)::int as negative_feedback,
        COUNT(CASE WHEN would_recommend = true THEN 1 END)::int as would_recommend_count
      FROM event_feedback 
      WHERE event_id = ${eventId}
    `

    // Get category breakdown
    const categoryStats = await prisma.$queryRaw`
      SELECT 
        category,
        COUNT(*)::int as count,
        AVG(rating)::numeric(3,2) as avg_rating
      FROM event_feedback 
      WHERE event_id = ${eventId}
      GROUP BY category
      ORDER BY count DESC
    `

    return NextResponse.json({
      feedback,
      stats: (stats as any)[0] || {},
      categoryStats: categoryStats || []
    })

  } catch (error: any) {
    console.error('Feedback fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
