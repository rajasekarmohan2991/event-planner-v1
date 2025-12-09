import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function ensureSubscriptionTables() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS subscription_links (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        plan VARCHAR(32) NOT NULL,
        period VARCHAR(16) NOT NULL,
        amount_in_minor BIGINT NOT NULL,
        currency VARCHAR(8) NOT NULL DEFAULT 'INR',
        code TEXT UNIQUE NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
        email TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        paid_at TIMESTAMP NULL,
        metadata JSONB
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_subscription_links_tenant ON subscription_links(tenant_id)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_subscription_links_code ON subscription_links(code)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_subscription_links_status ON subscription_links(status)`)
  } catch {}
}

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const role = String(((session as any).user?.role) || '')
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await ensureSubscriptionTables()

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true, name: true, slug: true, plan: true, status: true, billingEmail: true,
        createdAt: true, trialEndsAt: true, subscriptionStartedAt: true, subscriptionEndsAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const now = new Date()
    const results = [] as any[]
    for (const t of tenants) {
      const activeEnds = t.subscriptionEndsAt || null
      let trialEnds = t.trialEndsAt || new Date(t.createdAt.getTime() + 30*24*60*60*1000)
      const msLeftTrial = Math.max(0, (trialEnds.getTime() - now.getTime()))
      const msLeftSub = activeEnds ? Math.max(0, (activeEnds.getTime() - now.getTime())) : 0
      const trialDaysLeft = activeEnds ? Math.ceil(msLeftSub / (24*60*60*1000)) : Math.ceil(msLeftTrial / (24*60*60*1000))

      let lastLink: any = null
      try {
        const rows = await prisma.$queryRaw<any[]>`
          SELECT id, plan, period, amount_in_minor, currency, code, status, created_at, paid_at
          FROM subscription_links
          WHERE tenant_id = ${t.id}
          ORDER BY created_at DESC
          LIMIT 1
        `
        lastLink = rows && rows[0] ? {
          id: rows[0].id,
          plan: rows[0].plan,
          period: rows[0].period,
          amountInMinor: Number(rows[0].amount_in_minor||0),
          currency: rows[0].currency,
          code: rows[0].code,
          status: rows[0].status,
          createdAt: rows[0].created_at,
          paidAt: rows[0].paid_at,
        } : null
      } catch {}

      results.push({
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: t.plan,
        status: t.status,
        billingEmail: t.billingEmail,
        trialEndsAt: trialEnds,
        trialDaysLeft,
        subscriptionStartedAt: t.subscriptionStartedAt,
        subscriptionEndsAt: t.subscriptionEndsAt,
        lastLink,
      })
    }

    return NextResponse.json({ tenants: results })
  } catch (error: any) {
    console.error('Billing tenants list error:', error)
    return NextResponse.json({ message: 'Failed to load billing data' }, { status: 500 })
  }
}
