import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const createReviewSchema = z.object({
  bookingId: z.number().optional(),
  bookingType: z.enum(['VENDOR', 'SPONSOR', 'EXHIBITOR']).optional(),
  overallRating: z.number().min(1).max(5),
  qualityRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  professionalismRating: z.number().min(1).max(5).optional(),
  reviewTitle: z.string().optional(),
  reviewText: z.string().optional(),
  pros: z.string().optional(),
  cons: z.string().optional()
})

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string; providerId: string } }
) {
  try {
    const { tenantId, providerId } = params

    const reviews = await prisma.$queryRaw<any[]>`
      SELECT 
        pr.*,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as reviewer
      FROM provider_reviews pr
      LEFT JOIN "User" u ON u.id = pr.reviewer_id
      WHERE pr.provider_id = ${providerId}::bigint
      AND pr.tenant_id = ${tenantId}
      AND pr.is_public = true
      ORDER BY pr.created_at DESC
    `

    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(overall_rating) as avg_rating,
        COUNT(*) FILTER (WHERE overall_rating = 5) as five_star,
        COUNT(*) FILTER (WHERE overall_rating = 4) as four_star,
        COUNT(*) FILTER (WHERE overall_rating = 3) as three_star,
        COUNT(*) FILTER (WHERE overall_rating = 2) as two_star,
        COUNT(*) FILTER (WHERE overall_rating = 1) as one_star
      FROM provider_reviews
      WHERE provider_id = ${providerId}::bigint
      AND tenant_id = ${tenantId}
      AND is_public = true
    `

    return NextResponse.json({
      reviews,
      statistics: stats[0] || {}
    })

  } catch (error: any) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({
      error: 'Failed to fetch reviews',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string; providerId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId, providerId } = params
    const body = await req.json()
    const validatedData = createReviewSchema.parse(body)

    const provider = await prisma.$queryRaw<any[]>`
      SELECT id FROM service_providers 
      WHERE id = ${providerId}::bigint 
      AND tenant_id = ${tenantId}
    `

    if (!provider[0]) {
      return NextResponse.json({
        error: 'Provider not found'
      }, { status: 404 })
    }

    const userId = BigInt(session.user.id)

    const reviewResult = await prisma.$queryRaw<any[]>`
      INSERT INTO provider_reviews (
        provider_id, booking_id, booking_type, tenant_id, reviewer_id,
        overall_rating, quality_rating, communication_rating, 
        value_rating, professionalism_rating,
        review_title, review_text, pros, cons,
        is_verified, is_public, created_at, updated_at
      ) VALUES (
        ${providerId}::bigint,
        ${validatedData.bookingId ? validatedData.bookingId.toString() : null}::bigint,
        ${validatedData.bookingType || null},
        ${tenantId},
        ${userId}::bigint,
        ${validatedData.overallRating},
        ${validatedData.qualityRating || null},
        ${validatedData.communicationRating || null},
        ${validatedData.valueRating || null},
        ${validatedData.professionalismRating || null},
        ${validatedData.reviewTitle || null},
        ${validatedData.reviewText || null},
        ${validatedData.pros || null},
        ${validatedData.cons || null},
        true,
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `

    const reviewId = reviewResult[0]?.id

    // Update provider rating
    const avgRating = await prisma.$queryRaw<any[]>`
      SELECT 
        AVG(overall_rating) as avg_rating,
        COUNT(*) as review_count
      FROM provider_reviews
      WHERE provider_id = ${providerId}::bigint
      AND is_public = true
    `

    await prisma.$executeRaw`
      UPDATE service_providers
      SET 
        rating = ${avgRating[0].avg_rating}::decimal,
        total_reviews = ${avgRating[0].review_count}::int,
        updated_at = NOW()
      WHERE id = ${providerId}::bigint
    `

    const review = await prisma.$queryRaw<any[]>`
      SELECT pr.*, 
        json_build_object('id', u.id, 'name', u.name) as reviewer
      FROM provider_reviews pr
      LEFT JOIN "User" u ON u.id = pr.reviewer_id
      WHERE pr.id = ${reviewId}::bigint
    `

    return NextResponse.json({
      success: true,
      review: review[0],
      message: 'Review submitted successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Review creation error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to create review',
      details: error.message
    }, { status: 500 })
  }
}
