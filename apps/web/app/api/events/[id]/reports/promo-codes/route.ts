import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)

    const [codes, redemptions] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        `SELECT id::text, code, discount_type, discount_amount, is_active
         FROM promo_codes WHERE event_id = $1`,
        eventId
      ).catch(() => []),
      prisma.$queryRawUnsafe<any[]>(
        `SELECT promo_code_id::text AS id, COUNT(*)::int AS uses, COALESCE(SUM(discount_amount),0)::int AS discount
         FROM promo_redemptions WHERE promo_code_id IN (
           SELECT id FROM promo_codes WHERE event_id = $1
         )
         GROUP BY promo_code_id`,
        eventId
      ).catch(() => []),
    ])

    const totalPromoCodes = codes.length
    const activePromoCodes = codes.filter(c => c.is_active).length
    const totals = redemptions.reduce((acc, r) => { acc.uses += r.uses; acc.discount += r.discount; return acc }, { uses: 0, discount: 0 })
    const averageDiscountAmount = totalPromoCodes > 0 ? totals.discount / totalPromoCodes : 0

    // Find most used promo
    let mostUsedPromoCode = ''
    let mostUsedPromoCount = 0
    for (const r of redemptions) {
      if (r.uses > mostUsedPromoCount) {
        mostUsedPromoCount = r.uses
        const code = codes.find(c => c.id?.toString() === r.id?.toString())
        mostUsedPromoCode = code?.code || ''
      }
    }

    return NextResponse.json({
      totalPromoCodes,
      activePromoCodes,
      totalUses: totals.uses,
      totalDiscountAmount: totals.discount / 100, // paise -> rupees
      averageDiscountAmount: averageDiscountAmount / 100,
      mostUsedPromoCode,
      mostUsedPromoCount,
      promoCodeUsage: JSON.stringify(redemptions.map(r => ({ id: r.id, uses: r.uses, discount: r.discount/100 })))
    })
  } catch (error: any) {
    console.error('Error fetching promo code analytics:', error)
    return NextResponse.json({ message: 'Failed to load promo code analytics' }, { status: 500 })
  }
}
