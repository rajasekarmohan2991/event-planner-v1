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

export async function checkPromo({ code, userId, subtotal = 0 }: PromoCheckInput): Promise<PromoCheckResult> {
  const promo = await prisma.promoCode.findUnique({ where: { code } })
  if (!promo) return { valid: false, reason: 'NOT_FOUND' }

  if (promo.status !== 'ACTIVE') return { valid: false, reason: 'INACTIVE' }

  const now = new Date()
  if (promo.startsAt && now < promo.startsAt) return { valid: false, reason: 'NOT_STARTED' }
  if (promo.endsAt && now > promo.endsAt) return { valid: false, reason: 'EXPIRED' }

  if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
    return { valid: false, reason: 'MIN_ORDER_NOT_MET' }
  }

  // total cap
  if (typeof promo.maxRedemptions === 'number') {
    const total = await prisma.promoRedemption.count({ where: { promoCodeId: promo.id } })
    if (total >= promo.maxRedemptions) return { valid: false, reason: 'MAX_REDEMPTIONS_REACHED' }
  }

  // per-user cap
  if (userId && typeof promo.perUserLimit === 'number') {
    const userCount = await prisma.promoRedemption.count({
      where: { promoCodeId: promo.id, userId }
    })
    if (userCount >= promo.perUserLimit) return { valid: false, reason: 'PER_USER_LIMIT_REACHED' }
  }

  // compute discount
  let discount = 0
  if (promo.type === 'PERCENT') {
    const pct = Math.max(0, Math.min(100, promo.amount))
    discount = +(subtotal * (pct / 100)).toFixed(2)
  } else {
    discount = Math.max(0, +promo.amount.toFixed(2))
  }

  return {
    valid: true,
    type: promo.type,
    amount: promo.amount,
    currency: promo.currency ?? null,
    discount,
  }
}

export async function redeemPromo({ code, userId, subtotal = 0, orderId }: PromoCheckInput & { orderId?: string }) {
  const res = await checkPromo({ code, userId, subtotal })
  if (!res.valid) return res

  const promo = await prisma.promoCode.findUnique({ where: { code } })
  if (!promo) return { valid: false, reason: 'NOT_FOUND' } as PromoCheckResult

  await prisma.promoRedemption.create({
    data: {
      promoCodeId: promo.id,
      userId: typeof userId === 'bigint' ? userId : BigInt(0),
      orderId: orderId ?? null,
      amount: res.discount ?? null,
    },
  })

  return res
}
