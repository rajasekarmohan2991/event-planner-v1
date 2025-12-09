import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/promocodes - list codes (admin only)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: { redemptions: true },
  })

  const data = codes.map((c) => ({
    ...c,
    createdById: c.createdById ? c.createdById.toString() : null,
    redemptions: c.redemptions.map((r) => ({
      ...r,
      userId: r.userId.toString(),
    })),
  }))

  return NextResponse.json({ data })
}

// POST /api/promocodes - create code (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      code,
      type, // 'PERCENT' | 'FIXED'
      amount,
      currency,
      maxRedemptions,
      perUserLimit,
      startsAt,
      endsAt,
      minOrderAmount,
      scope,
      scopeRef,
      status = 'ACTIVE',
    } = body || {}

    if (!code || !type || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const created = await prisma.promoCode.create({
      data: {
        code: String(code).trim().toUpperCase(),
        type,
        amount,
        currency: currency ?? null,
        maxRedemptions: maxRedemptions ?? null,
        perUserLimit: perUserLimit ?? null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        minOrderAmount: minOrderAmount ?? null,
        scope: scope ?? null,
        scopeRef: scopeRef ?? null,
        status,
        createdById: session.user.id ? BigInt(session.user.id as unknown as string) : null,
      },
    })

    return NextResponse.json({
      data: { ...created, createdById: created.createdById ? created.createdById.toString() : null },
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to create promocode', details: e?.message }, { status: 500 })
  }
}
