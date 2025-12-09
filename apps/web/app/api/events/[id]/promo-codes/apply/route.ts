import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Session is optional for applying promo codes (public registration flow)
    const session = await getServerSession(authOptions as any).catch(() => null)

    const body = await req.json()
    const { code, orderAmount } = body

    console.log('🎟️ Apply promo code request:', { code, orderAmount, eventId: params.id })

    if (!code) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 })
    }

    if (typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json({ error: 'Valid order amount is required' }, { status: 400 })
    }

    const eventId = params.id
    const userId = (session as any)?.user?.id

    // Find promo code in database (specific event OR global)
    const promoCode = await prisma.promoCode.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        isActive: true,
        OR: [
          { eventId: BigInt(eventId) },
          { eventId: 0 } // Global codes
        ]
      },
    })
    
    console.log('🔍 Promo code lookup:', { 
      searchCode: code.toUpperCase().trim(), 
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

    // Validation 1: Check if promo code has started
    const now = new Date()
    if (promoCode.startsAt && promoCode.startsAt > now) {
      const startDate = promoCode.startsAt.toLocaleDateString()
      return NextResponse.json({ 
        error: `Promo code will be active from ${startDate}`,
        valid: false 
      }, { status: 400 })
    }

    // Validation 2: Check if promo code has expired
    // Set time to end of day for endsAt to allow usage throughout the end date
    if (promoCode.endsAt) {
      const endOfDay = new Date(promoCode.endsAt)
      endOfDay.setHours(23, 59, 59, 999)
      
      if (endOfDay < now) {
        const endDate = promoCode.endsAt.toLocaleDateString()
        console.log('❌ Promo code expired:', { code, endsAt: promoCode.endsAt, now, endOfDay })
        return NextResponse.json({ 
          error: `Promo code expired on ${endDate}`,
          valid: false 
        }, { status: 400 })
      }
    }

    // Validation 3: Check maximum redemptions (total usage limit)
    if (promoCode.maxRedemptions && promoCode.maxRedemptions > 0) {
      if (promoCode.usedCount >= promoCode.maxRedemptions) {
        return NextResponse.json({ 
          error: 'Promo code usage limit has been reached',
          valid: false 
        }, { status: 400 })
      }
    }

    // Validation 4: Check per-user limit (skipped for now - no redemptions table)
    // You can implement user-specific tracking later if needed

    // Validation 5: Check minimum order amount
    if (promoCode.minOrderAmount && orderAmount < promoCode.minOrderAmount) {
      return NextResponse.json({ 
        error: `Minimum order amount of ₹${promoCode.minOrderAmount} is required`,
        valid: false 
      }, { status: 400 })
    }

    // Calculate discount
    const originalAmount = Number(orderAmount) || 0
    let discountAmount = 0

    if (promoCode.type === 'PERCENT') {
      // Percentage discount
      discountAmount = Math.floor((originalAmount * Number(promoCode.amount)) / 100)
    } else if (promoCode.type === 'FIXED') {
      // Fixed amount discount
      discountAmount = Number(promoCode.amount)
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
      description: `${promoCode.type === 'PERCENT' ? promoCode.amount + '%' : '₹' + promoCode.amount} discount applied`,
    })
  } catch (error: any) {
    console.error('Promo code application error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to apply promo code',
      valid: false 
    }, { status: 500 })
  }
}
