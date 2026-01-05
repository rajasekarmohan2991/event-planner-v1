import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

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
      where: { id: BigInt(codeId) },
      data: {
        code: code ? String(code).trim().toUpperCase() : undefined,
        type: discountType,
        amount: Math.round(discountAmount),
        maxRedemptions: maxUses === -1 ? -1 : maxUses,
        perUserLimit: maxUsesPerUser,
        startsAt: startDate ? new Date(startDate) : null,
        endsAt: endDate ? new Date(endDate) : null,
        minOrderAmount: Math.round(minOrderAmount || 0),
        isActive: isActive !== false,
        description: body.description || ''
      },
    })

    return NextResponse.json({
      id: String(updated.id),
      eventId: Number(updated.eventId),
      code: updated.code,
      discountType: updated.type,
      discountAmount: updated.amount,
      maxUses: updated.maxRedemptions,
      usedCount: updated.usedCount,
      maxUsesPerUser: updated.perUserLimit,
      minOrderAmount: updated.minOrderAmount,
      startDate: updated.startsAt,
      endDate: updated.endsAt,
      isActive: updated.isActive,
      description: updated.description,
      createdAt: updated.createdAt,
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
    await prisma.promoCode.delete({ where: { id: BigInt(codeId) } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to delete promo code' }, { status: 500 })
  }
}
