import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'

export async function PUT(req: NextRequest, { params }: { params: { id: string; codeId: string } }) {
  const { id: eventId, codeId } = params
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const allowed = await requireEventRole(eventId, ['STAFF', 'ORGANIZER', 'OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const { code, discountType, discountAmount, maxUses, maxUsesPerUser, minOrderAmount, startDate, endDate, isActive } = body

    const updated = await prisma.promoCode.update({
      where: { id: codeId },
      data: {
        code: code ? String(code).trim().toUpperCase() : undefined,
        type: discountType,
        amount: discountAmount,
        currency: discountType === 'FIXED' ? 'INR' : null,
        maxRedemptions: maxUses === -1 ? null : maxUses,
        perUserLimit: maxUsesPerUser,
        startsAt: startDate ? new Date(startDate) : null,
        endsAt: endDate ? new Date(endDate) : null,
        minOrderAmount: minOrderAmount || null,
        status: isActive ? 'ACTIVE' : 'INACTIVE',
      },
      include: { redemptions: true },
    })

    return NextResponse.json({
      id: updated.id,
      eventId: parseInt(eventId),
      code: updated.code,
      discountType: updated.type,
      discountAmount: updated.amount,
      maxUses: updated.maxRedemptions ?? -1,
      usedCount: updated.redemptions.length,
      maxUsesPerUser: updated.perUserLimit ?? 1,
      minOrderAmount: updated.minOrderAmount ?? 0,
      startDate: updated.startsAt?.toISOString(),
      endDate: updated.endsAt?.toISOString(),
      isActive: updated.status === 'ACTIVE',
      description: '',
      createdAt: updated.createdAt.toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to update promo code' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; codeId: string } }) {
  const { id: eventId, codeId } = params
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const allowed = await requireEventRole(eventId, ['STAFF', 'ORGANIZER', 'OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    await prisma.promoCode.delete({ where: { id: codeId } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to delete promo code' }, { status: 500 })
  }
}
