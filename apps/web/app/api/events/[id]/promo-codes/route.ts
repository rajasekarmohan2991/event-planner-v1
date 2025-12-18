import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function ensurePromoTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id BIGSERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENT',
        discount_amount INTEGER NOT NULL,
        max_uses INTEGER NOT NULL DEFAULT -1,
        used_count INTEGER NOT NULL DEFAULT 0,
        max_uses_per_user INTEGER NOT NULL DEFAULT 1,
        min_order_amount INTEGER NOT NULL DEFAULT 0,
        applicable_ticket_ids TEXT,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_promo_codes_event ON promo_codes(event_id)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active)`)
  } catch { }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    await ensurePromoTable()
    // Use Prisma model for consistency
    const codes = await prisma.promoCode.findMany({
      where: { eventId: BigInt(eventId) },
      orderBy: { createdAt: 'desc' },
    })

    // Map to expected response format
    const response = codes.map(code => ({
      id: String(code.id),
      eventId: String(code.eventId),
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
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    await ensurePromoTable()
    const rawBody = await req.text()
    console.log('[API] Promo Code Raw Body:', rawBody)

    let body
    try {
      body = JSON.parse(rawBody)
    } catch {
      console.log('[API] Failed to parse JSON body')
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
    }

    const { code, discountType, discountAmount, maxUses, maxUsesPerUser, minOrderAmount, startDate, endDate, isActive } = body

    if (!code || !discountType || typeof discountAmount !== 'number') {
      console.log('[API] Validation failed:', { code, discountType, discountAmountType: typeof discountAmount })
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Use Prisma model for consistency
    const promoCode = await prisma.promoCode.create({
      data: {
        eventId: BigInt(eventId),
        code: String(code).trim().toUpperCase(),
        type: String(discountType || 'PERCENT').toUpperCase(),
        amount: discountAmount,
        maxRedemptions: maxUses ?? -1,
        perUserLimit: maxUsesPerUser ?? 1,
        minOrderAmount: minOrderAmount ?? 0,
        startsAt: startDate ? new Date(startDate) : null,
        endsAt: endDate ? new Date(endDate) : null,
        isActive: isActive !== false,
        description: body.description || null,
      },
    })

    return NextResponse.json({
      id: String(promoCode.id),
      eventId: String(promoCode.eventId),
      code: promoCode.code,
      discountType: promoCode.type,
      discountAmount: promoCode.amount,
      maxUses: promoCode.maxRedemptions,
      usedCount: promoCode.usedCount,
      maxUsesPerUser: promoCode.perUserLimit,
      minOrderAmount: promoCode.minOrderAmount,
      startDate: promoCode.startsAt,
      endDate: promoCode.endsAt,
      isActive: promoCode.isActive,
      description: promoCode.description,
      createdAt: promoCode.createdAt,
    }, { status: 201 })
  } catch (e: any) {
    const msg: string = e?.message || ''
    // Handle duplicate code constraint gracefully
    if (msg.includes('duplicate key') || msg.includes('promo_codes_code_key') || msg.toLowerCase().includes('unique')) {
      return NextResponse.json({ message: 'Promo code already exists' }, { status: 409 })
    }
    console.error('Error creating promo code:', e)
    return NextResponse.json({
      message: msg || 'Failed to create promo code',
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}
