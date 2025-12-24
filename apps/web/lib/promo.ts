import prisma from '@/lib/prisma'

export type PromoCheckInput = {
  code: string
  userId?: bigint
  subtotal?: number // order subtotal before discount
}

export type PromoCheckResult = {
  valid: boolean
  reason?: string
  type?: 'PERCENT' | 'FIXED'
  amount?: number
  currency?: string | null
  discount?: number // computed discount amount given subtotal
}

export async function checkPromo({ code, userId, subtotal = 0 }: PromoCheckInput, eventId?: bigint): Promise<PromoCheckResult> {
  const promo = await prisma.promoCode.findFirst({
    where: {
      code,
      ...(eventId && { eventId })
    }
  })
  if (!promo) return { valid: false, reason: 'NOT_FOUND' }

  if (!promo.isActive) return { valid: false, reason: 'INACTIVE' }

  const now = new Date()
  if (promo.startsAt && now < promo.startsAt) return { valid: false, reason: 'NOT_STARTED' }
  if (promo.endsAt && now > promo.endsAt) return { valid: false, reason: 'EXPIRED' }

  if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
    return { valid: false, reason: 'MIN_ORDER_NOT_MET' }
  }

  // total cap
  if (promo.maxRedemptions && promo.maxRedemptions > 0) {
    if (promo.usedCount >= promo.maxRedemptions) return { valid: false, reason: 'MAX_REDEMPTIONS_REACHED' }
  }

  // per-user cap - redemption tracking might be handled elsewhere if model is missing
  /*
  if (userId && typeof promo.perUserLimit === 'number') {
    const userCount = await prisma.promoRedemption.count({
      where: { promoCodeId: promo.id, userId }
    })
    if (userCount >= promo.perUserLimit) return { valid: false, reason: 'PER_USER_LIMIT_REACHED' }
  }
  */

  // compute discount
  let discount = 0
  if (promo.type === 'PERCENT') {
    const pct = Math.max(0, Math.min(100, promo.amount))
    discount = +(subtotal * (pct / 100)).toFixed(2)
  } else {
    discount = Math.max(0, +promo.amount)
  }

  return {
    valid: true,
    type: promo.type as any,
    amount: promo.amount,
    currency: 'INR',
    discount,
  }
}

export async function redeemPromo({ code, userId, subtotal = 0, orderId }: PromoCheckInput & { orderId?: string }, eventId?: bigint) {
  const res = await checkPromo({ code, userId, subtotal }, eventId)
  if (!res.valid) return res

  // Increment usage
  await prisma.promoCode.updateMany({
    where: { code, eventId: eventId || BigInt(0) },
    data: { usedCount: { increment: 1 } }
  })

  return res
}
