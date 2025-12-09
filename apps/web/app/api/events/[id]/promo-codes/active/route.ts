import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/events/[id]/promo-codes/active - Get active promo codes for an event
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id

    // Validate eventId is numeric
    if (isNaN(Number(eventId))) {
      return NextResponse.json({ 
        success: true,
        promoCodes: []
      })
    }

    // Get active promo codes for this event using Prisma model
    const promoCodes = await prisma.promoCode.findMany({
      where: {
        eventId: BigInt(eventId),
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: new Date() } }
        ],
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: new Date() } }
            ]
          }
        ]
      },
      orderBy: {
        amount: 'desc'
      },
      take: 10
    })

    // Filter by max redemptions and format response
    const activePromoCodes = promoCodes
      .filter(code => {
        if (code.maxRedemptions === -1) return true
        return code.usedCount < code.maxRedemptions
      })
      .map(code => ({
        id: Number(code.id),
        code: code.code,
        discountType: code.type,
        discountValue: code.amount,
        minOrderAmount: code.minOrderAmount,
        startDate: code.startsAt?.toISOString(),
        endDate: code.endsAt?.toISOString(),
        maxUses: code.maxRedemptions,
        usageCount: code.usedCount,
        description: `${code.type === 'PERCENT' ? code.amount + '%' : '₹' + code.amount} off`
      }))

    return NextResponse.json({
      success: true,
      promoCodes: activePromoCodes
    })

  } catch (error: any) {
    console.error('Error fetching active promo codes:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch promo codes',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
