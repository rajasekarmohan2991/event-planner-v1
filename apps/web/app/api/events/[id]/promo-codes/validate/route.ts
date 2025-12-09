import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET handler for query params (used by some components)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const orderAmount = parseInt(searchParams.get('orderAmount') || '0')
  
  return validatePromoCode(eventId, code, orderAmount)
}

// POST handler for JSON body
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const body = await req.json().catch(() => ({}))
  const { code, orderAmount } = body
  
  return validatePromoCode(eventId, code, orderAmount)
}

async function validatePromoCode(eventId: string, code: string | null, orderAmount: number) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ valid: false, errorMessage: 'Unauthorized' }, { status: 401 })

  try {

    if (!code || !code.trim()) {
      return NextResponse.json({ valid: false, errorMessage: 'Promo code is required' }, { status: 400 })
    }

    if (typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json({ valid: false, errorMessage: 'Valid order amount is required' }, { status: 400 })
    }

    const userId = (session as any)?.user?.id

    // Convert eventId to BigInt for database query
    let eventIdBigInt: bigint
    try {
      eventIdBigInt = BigInt(eventId)
    } catch {
      return NextResponse.json({ valid: false, errorMessage: 'Invalid event ID' }, { status: 400 })
    }
    
    const promoCode = await prisma.promoCode.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        eventId: eventIdBigInt,
        isActive: true,
      },
    })

    if (!promoCode) {
      return NextResponse.json({ valid: false, errorMessage: 'Invalid or inactive promo code' })
    }

    // Validation 1: Check start date
    const now = new Date()
    if (promoCode.startsAt && promoCode.startsAt > now) {
      const startDate = promoCode.startsAt.toLocaleDateString()
      return NextResponse.json({ 
        valid: false, 
        errorMessage: `Promo code will be active from ${startDate}` 
      })
    }

    // Validation 2: Check expiry date (relaxed - allow same day)
    if (promoCode.endsAt) {
      const endDate = new Date(promoCode.endsAt)
      endDate.setHours(23, 59, 59, 999) // End of day
      if (endDate < now) {
        return NextResponse.json({ valid: false, errorMessage: 'Promo code has expired' })
      }
    }

    // Validation 3: Check total usage limit
    if (promoCode.maxRedemptions && promoCode.maxRedemptions > 0) {
      if (promoCode.usedCount >= promoCode.maxRedemptions) {
        return NextResponse.json({ 
          valid: false, 
          errorMessage: 'Promo code usage limit has been reached' 
        })
      }
    }

    // Validation 4: Check per-user limit (if needed, implement user-specific tracking)
    // For now, we'll skip per-user validation as we don't have a redemptions table
    // You can add this later by creating a separate tracking mechanism

    // Validation 5: Check minimum order amount
    if (promoCode.minOrderAmount && orderAmount < promoCode.minOrderAmount) {
      return NextResponse.json({
        valid: false,
        errorMessage: `Minimum order amount of ₹${promoCode.minOrderAmount} is required`,
      })
    }

    // Calculate discount
    let calculatedDiscount = 0
    if (promoCode.type === 'PERCENT') {
      calculatedDiscount = Math.floor((orderAmount * Number(promoCode.amount)) / 100)
    } else {
      calculatedDiscount = Number(promoCode.amount)
    }

    // Ensure discount doesn't exceed order amount
    calculatedDiscount = Math.min(calculatedDiscount, orderAmount)

    return NextResponse.json({
      valid: true,
      code: promoCode.code,
      discountType: promoCode.type,
      discountAmount: promoCode.amount,
      calculatedDiscount,
      finalAmount: orderAmount - calculatedDiscount,
      message: `${promoCode.type === 'PERCENT' ? promoCode.amount + '%' : '₹' + promoCode.amount} discount will be applied`
    })
  } catch (e: any) {
    console.error('Promo code validation error:', e)
    return NextResponse.json({ valid: false, errorMessage: e?.message || 'Validation failed' }, { status: 500 })
  }
}
