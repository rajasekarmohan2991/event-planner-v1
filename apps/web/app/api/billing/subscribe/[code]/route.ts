import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

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
  } catch { }
}

export const dynamic = 'force-dynamic'

// GET: fetch link details by code
export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  try {
    await ensureSubscriptionTables()
    const code = params.code
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, tenant_id, plan, period, amount_in_minor, currency, code, status, email, created_at, paid_at
      FROM subscription_links
      WHERE code = ${code}
      LIMIT 1
    `
    if (!rows || rows.length === 0) {
      return NextResponse.json({ message: 'Invalid link' }, { status: 404 })
    }
    const r = rows[0]
    return NextResponse.json({
      id: r.id,
      tenantId: r.tenant_id,
      plan: r.plan,
      period: r.period,
      amountInr: Number(r.amount_in_minor || 0) / 100,
      currency: r.currency,
      code: r.code,
      status: r.status,
      email: r.email,
      createdAt: r.created_at,
      paidAt: r.paid_at,
    })
  } catch (e: any) {
    console.error('Fetch subscription link error:', e)
    return NextResponse.json({ message: 'Failed to load link' }, { status: 500 })
  }
}

// POST: confirm payment and activate subscription (public endpoint from payment link)
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    await ensureSubscriptionTables()
    const code = params.code
    const body = await req.json().catch(() => ({}))
    const payerEmail = body?.email as string | undefined

    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, tenant_id, plan, period, amount_in_minor, currency, status, email
      FROM subscription_links
      WHERE code = ${code}
      LIMIT 1
    `
    if (!rows || rows.length === 0) {
      return NextResponse.json({ message: 'Invalid link' }, { status: 404 })
    }
    const link = rows[0]
    if ((link.status || '').toUpperCase() === 'PAID') {
      return NextResponse.json({ message: 'Already paid' }, { status: 200 })
    }

    const now = new Date()
    const ends = new Date(now)
    const period = String(link.period || 'MONTHLY').toUpperCase()
    if (period === 'YEARLY' || period === 'ANNUAL' || period === 'ANNUALLY') {
      ends.setDate(ends.getDate() + 365)
    } else {
      ends.setDate(ends.getDate() + 30)
    }

    // Mark link as paid
    await prisma.$executeRaw`
      UPDATE subscription_links
      SET status = 'PAID', paid_at = ${now}, metadata = COALESCE(metadata,'{}'::jsonb) || ${JSON.stringify({ payerEmail })}
      WHERE id = ${link.id}
    `

    // Update tenant plan and subscription period
    const plan = String(link.plan || 'PRO').toUpperCase()
    await prisma.tenant.update({
      where: { id: link.tenant_id },
      data: {
        plan,
        status: 'ACTIVE',
        subscriptionStartedAt: now,
        subscriptionEndsAt: ends,
      }
    })

    // Notify billing email
    try {
      const emailTo = link.email || undefined
      if (emailTo) {
        await sendEmail({
          to: emailTo,
          subject: `Subscription Activated - ${plan}`,
          html: `<p>Your subscription is now active.</p><p>Plan: <b>${plan}</b> (${period})</p><p>Valid till: <b>${ends.toDateString()}</b></p>`
        })
      }
    } catch { }

    return NextResponse.json({ success: true, plan, period, subscriptionEndsAt: ends })
  } catch (e: any) {
    console.error('Activate subscription error:', e)
    return NextResponse.json({ message: 'Failed to activate subscription' }, { status: 500 })
  }
}
