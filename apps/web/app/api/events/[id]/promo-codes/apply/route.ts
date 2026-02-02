import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Parse body safely
    const body = await req.json().catch(() => ({}))
    const { code, orderAmount } = body

    console.log('🎟️ Apply promo code request:', { code, orderAmount, eventId: params.id })

    // Allow empty codes - just return no discount
    if (!code || String(code).trim() === '') {
      return NextResponse.json({
        valid: true,
        code: '',
        discountType: 'NONE',
        discountAmount: 0,
        calculatedDiscount: 0,
        originalAmount: orderAmount || 0,
        finalAmount: orderAmount || 0,
        description: 'No promo code applied',
      })
    }

    if (typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json({ error: 'Valid order amount is required' }, { status: 400 })
    }

    let eventId: bigint
    try {
      eventId = BigInt(params.id)
    } catch {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const normalizedCode = String(code).trim().toUpperCase()

    // Find promo code using Raw SQL
    const promoCodes = await prisma.$queryRaw`
      SELECT 
        code, 
        discount_type as "type", 
        discount_amount as "amount", 
        max_uses as "maxRedemptions", 
        used_count as "usedCount", 
        min_order_amount as "minOrderAmount", 
        start_date as "startsAt", 
        end_date as "endsAt",
        is_active as "isActive"
      FROM promo_codes
      WHERE code = ${normalizedCode}
      AND is_active = true
      AND (event_id = ${eventId} OR event_id = 0)
      LIMIT 1
    ` as any[]

    const promoCode = promoCodes[0]

    console.log('🔍 Promo code lookup:', {
      searchCode: normalizedCode,
      found: !!promoCode,
      isActive: promoCode?.isActive,
      startsAt: promoCode?.startsAt,
      endsAt: promoCode?.endsAt
    })

    if (!promoCode) {
      return NextResponse.json({
        error: 'Invalid promo code',
        valid: false
      }, { status: 400 })
    }

    // Validation 1: Check start date
    const now = new Date()
    if (promoCode.startsAt && new Date(promoCode.startsAt) > now) {
      const startDate = new Date(promoCode.startsAt).toLocaleDateString()
      return NextResponse.json({
        error: `Promo code will be active from ${startDate}`,
        valid: false
      }, { status: 400 })
    }

    // Validation 2: Check expiry date
    if (promoCode.endsAt) {
      const endOfDay = new Date(promoCode.endsAt)
      endOfDay.setHours(23, 59, 59, 999)

      if (endOfDay < now) {
        const endDate = new Date(promoCode.endsAt).toLocaleDateString()
        console.log('❌ Promo code expired:', { code, endsAt: promoCode.endsAt, now, endOfDay })
        return NextResponse.json({
          error: `Promo code expired on ${endDate}`,
          valid: false
        }, { status: 400 })
      }
    }

    // Validation 3: Check usage limit
    if (promoCode.maxRedemptions && promoCode.maxRedemptions != -1) {
      if (promoCode.usedCount >= promoCode.maxRedemptions) {
        return NextResponse.json({
          error: 'Promo code usage limit has been reached',
          valid: false
        }, { status: 400 })
      }
    }

    // Validation 4: Check minimum order amount
    if (promoCode.minOrderAmount && orderAmount < promoCode.minOrderAmount) {
      return NextResponse.json({
        error: `Minimum order amount of ₹${promoCode.minOrderAmount} is required`,
        valid: false
      }, { status: 400 })
    }

    // Calculate discount
    const originalAmount = Number(orderAmount) || 0
    let discountAmount = 0
    const amountVal = Number(promoCode.amount)

    if (promoCode.type === 'PERCENT') {
      discountAmount = Math.floor((originalAmount * amountVal) / 100)
    } else {
      // FIXED
      discountAmount = amountVal
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, originalAmount)
    const finalAmount = Math.max(0, originalAmount - discountAmount)

    return NextResponse.json({
      valid: true,
      code: promoCode.code,
      discountType: promoCode.type,
      discountAmount: promoCode.amount,
      calculatedDiscount: discountAmount,
      originalAmount,
      finalAmount,
      description: `${promoCode.type === 'PERCENT' ? amountVal + '%' : '₹' + amountVal} discount applied`,
    })

  } catch (error: any) {
    console.error('Promo code application error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to apply promo code',
      valid: false
    }, { status: 500 })
  }
}
