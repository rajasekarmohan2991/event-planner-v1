import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST handler for JSON body
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}))
    const { code, orderAmount } = body
    return validatePromoCode(params.id, code, orderAmount)
  } catch (e: any) {
    return NextResponse.json({ valid: false, errorMessage: e?.message || 'Validation failed' }, { status: 500 })
  }
}

async function validatePromoCode(eventId: string, code: string | null, orderAmount: number) {
  try {

    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, errorMessage: 'Promo code is required' }, { status: 400 })
    }

    if (typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json({ valid: false, errorMessage: 'Valid order amount is required' }, { status: 400 })
    }

    let eventIdBigInt: bigint
    try {
      eventIdBigInt = BigInt(eventId)
    } catch {
      return NextResponse.json({ valid: false, errorMessage: 'Invalid event ID' }, { status: 400 })
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
      AND (event_id = ${eventIdBigInt} OR event_id = 0)
      LIMIT 1
    ` as any[]

    const promoCode = promoCodes[0]

    if (!promoCode) {
      return NextResponse.json({ valid: false, errorMessage: 'Invalid or inactive promo code' })
    }

    // Validation 1: Check start date
    const now = new Date()
    if (promoCode.startsAt && new Date(promoCode.startsAt) > now) {
      const startDate = new Date(promoCode.startsAt).toLocaleDateString()
      return NextResponse.json({
        valid: false,
        errorMessage: `Promo code will be active from ${startDate}`
      })
    }

    // Validation 2: Check expiry date
    if (promoCode.endsAt) {
      const endDate = new Date(promoCode.endsAt)
      endDate.setHours(23, 59, 59, 999) // End of day
      if (endDate < now) {
        return NextResponse.json({ valid: false, errorMessage: 'Promo code has expired' })
      }
    }

    // Validation 3: Check total usage limit
    if (promoCode.maxRedemptions && promoCode.maxRedemptions != -1) {
      if (promoCode.usedCount >= promoCode.maxRedemptions) {
        return NextResponse.json({
          valid: false,
          errorMessage: 'Promo code usage limit has been reached'
        })
      }
    }

    // Validation 4: Check minimum order amount
    if (promoCode.minOrderAmount && orderAmount < promoCode.minOrderAmount) {
      return NextResponse.json({
        valid: false,
        errorMessage: `Minimum order amount of ₹${promoCode.minOrderAmount} is required`,
      })
    }

    // Calculate discount
    let calculatedDiscount = 0
    const amountVal = Number(promoCode.amount) || 0
    if (promoCode.type === 'PERCENT') {
      calculatedDiscount = Math.floor((orderAmount * amountVal) / 100)
    } else {
      calculatedDiscount = amountVal
    }

    // Ensure discount doesn't exceed order amount
    calculatedDiscount = Math.min(calculatedDiscount, orderAmount)

    return NextResponse.json({
      valid: true,
      code: promoCode.code,
      discountType: promoCode.type,
      discountAmount: amountVal,
      calculatedDiscount,
      finalAmount: orderAmount - calculatedDiscount,
      message: `${promoCode.type === 'PERCENT' ? amountVal + '%' : '₹' + amountVal} discount will be applied`
    })
  } catch (e: any) {
    console.error('Promo code validation error:', e)
    return NextResponse.json({ valid: false, errorMessage: e?.message || 'Validation failed' }, { status: 500 })
  }
}
