
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const codes = await prisma.promoCode.findMany({
      where: {
        eventId: BigInt(eventId)
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const response = codes.map(code => ({
      id: code.id.toString(),
      eventId: code.eventId.toString(),
      code: code.code,
      discountType: code.type,
      discountAmount: code.amount,
      maxUses: code.maxRedemptions,
      usedCount: code.usedCount,
      maxUsesPerUser: code.perUserLimit,
      minOrderAmount: code.minOrderAmount,
      startDate: code.startsAt,
      endDate: code.endsAt,
      isActive: code.isActive,
      description: code.description,
      createdAt: code.createdAt,
    }))

    return NextResponse.json(response)
  } catch (e: any) {
    console.error('Error fetching promo codes:', e)
    return NextResponse.json({
      message: e?.message || 'Failed to load promo codes',
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    let body
    let bodyText = ''
    try {
      bodyText = await req.text()
      try {
        body = JSON.parse(bodyText)
      } catch (e) {
        // Only log if body is not empty/whitespace, otherwise it might be just an empty body which is also handled
        if (bodyText.trim()) {
          console.error('❌ Invalid JSON in promo code POST:', e, 'Body:', bodyText)
        }
        // If bodyText is empty and we expect JSON, JSON.parse fails.
        // But if we want to valid "missing body" as "missing code", we can proceed with empty object?
        // No, req.json() on empty body throws.
        // Let's assume empty body => empty object.
        if (!bodyText.trim()) {
          body = {}
        } else {
          return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
        }
      }
    } catch (e) {
      console.error('❌ Failed to read request body:', e)
      return NextResponse.json({ message: 'Failed to read body' }, { status: 400 })
    }

    let { code, discountType, discountAmount, maxUses, maxUsesPerUser, minOrderAmount, startDate, endDate, isActive, description } = body

    console.log('📝 Promo code POST received:', {
      eventId,
      codeRaw: code,
      bodyKeys: Object.keys(body || {}),
      bodySnippet: bodyText.slice(0, 100)
    })

    // 1. Sanitize Code
    code = String(code || '').trim().toUpperCase()
    if (!code) {
      console.error('❌ Missing code in promo code POST')
      return NextResponse.json({ message: 'Code is required' }, { status: 400 })
    }

    // 2. Sanitize Numbers (Relaxed - default to 0/1/-1)
    discountAmount = Number(discountAmount);
    if (isNaN(discountAmount)) discountAmount = 0;

    maxUses = Number(maxUses);
    if (isNaN(maxUses)) maxUses = -1;

    maxUsesPerUser = Number(maxUsesPerUser);
    if (isNaN(maxUsesPerUser)) maxUsesPerUser = 1;

    minOrderAmount = Number(minOrderAmount);
    if (isNaN(minOrderAmount)) minOrderAmount = 0;

    // 3. Sanitize Dates
    const safeDate = (d: any) => {
      if (!d) return null;
      const dateObj = new Date(d);
      return isNaN(dateObj.getTime()) ? null : dateObj;
    }

    const start = safeDate(startDate);
    const end = safeDate(endDate);

    discountType = String(discountType || 'PERCENT').toUpperCase();

    // 4. Create using Prisma Client
    try {
      const newPromo = await prisma.promoCode.create({
        data: {
          eventId: BigInt(eventId),
          code,
          type: discountType,
          amount: Math.round(discountAmount),
          maxRedemptions: maxUses,
          perUserLimit: maxUsesPerUser,
          minOrderAmount: minOrderAmount,
          startsAt: start,
          endsAt: end,
          isActive: isActive !== false,
          description: description || null
        }
      })

      return NextResponse.json({
        id: String(newPromo.id),
        eventId: String(newPromo.eventId),
        code: newPromo.code,
        discountType: newPromo.type,
        discountAmount: newPromo.amount,
        maxUses: newPromo.maxRedemptions,
        usedCount: newPromo.usedCount,
        maxUsesPerUser: newPromo.perUserLimit,
        minOrderAmount: newPromo.minOrderAmount,
        startDate: newPromo.startsAt,
        endDate: newPromo.endsAt,
        isActive: newPromo.isActive,
        description: newPromo.description,
        createdAt: newPromo.createdAt,
        message: 'Promo code created successfully'
      }, { status: 201 })

    } catch (e: any) {
      if (e.code === 'P2002') {
        return NextResponse.json({ message: 'Promo code already exists' }, { status: 409 })
      }
      throw e
    }

  } catch (error: any) {
    console.error('❌ Promo code creation failed:', {
      message: error.message,
      detail: error.detail,
      eventId: params.id
    })
    return NextResponse.json({
      message: 'Failed to create promo code',
      error: error.message,
      details: error.code
    }, { status: 500 })
  }
}
