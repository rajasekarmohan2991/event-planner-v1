
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const codes = await prisma.$queryRaw`
      SELECT 
        id, event_id as "eventId", code, 
        discount_type as "discountType", 
        discount_amount as "discountAmount", 
        max_uses as "maxUses", 
        used_count as "usedCount", 
        max_uses_per_user as "maxUsesPerUser", 
        min_order_amount as "minOrderAmount", 
        start_date as "startDate", 
        end_date as "endDate", 
        is_active as "isActive", 
        description, 
        created_at as "createdAt"
      FROM promo_codes
      WHERE event_id = ${BigInt(eventId)}
      ORDER BY created_at DESC
    ` as any[]

    const response = codes.map(code => ({
      id: String(code.id),
      eventId: String(code.eventId),
      code: code.code,
      discountType: code.discountType,
      discountAmount: code.discountAmount,
      maxUses: code.maxUses,
      usedCount: code.usedCount,
      maxUsesPerUser: code.maxUsesPerUser,
      minOrderAmount: code.minOrderAmount,
      startDate: code.startDate,
      endDate: code.endDate,
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
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }

    let { code, discountType, discountAmount, maxUses, maxUsesPerUser, minOrderAmount, startDate, endDate, isActive, description } = body

    console.log('📝 Promo code data received:', { code, discountType, discountAmount, maxUses, maxUsesPerUser, minOrderAmount, startDate, endDate, isActive })

    // 1. Sanitize Code
    code = String(code || '').trim().toUpperCase()
    if (!code) {
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

    // 4. Insert (Raw SQL)
    const result = await prisma.$queryRaw`
      INSERT INTO promo_codes (
        event_id, code, discount_type, discount_amount, max_uses,
        max_uses_per_user, min_order_amount, start_date, end_date,
        is_active, description, created_at, updated_at
      ) VALUES (
        ${BigInt(eventId)}, 
        ${code}, 
        ${discountType}, 
        ${Math.round(discountAmount)},
        ${maxUses}, 
        ${maxUsesPerUser}, 
        ${minOrderAmount},
        ${start}, 
        ${end}, 
        ${isActive !== false}, 
        ${description || null},
        NOW(), NOW()
      )
      RETURNING id, code
    ` as any[]

    const saved = result[0]

    return NextResponse.json({
      id: String(saved.id),
      code: saved.code,
      message: 'Promo code created successfully'
    }, { status: 201 })

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
