import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
  } catch {}
}

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { tenantId, plan, period, amountInr, email } = body || {}
    if (!tenantId || !plan || !period || !amountInr) {
      return NextResponse.json({ message: 'tenantId, plan, period, amountInr are required' }, { status: 400 })
    }

    const amountInMinor = Math.round(Number(amountInr) * 100)
    const id = (globalThis as any).crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    const code = `${Math.random().toString(36).slice(2,4)}${Date.now().toString(36)}${Math.random().toString(36).slice(2,4)}`.toUpperCase()

    await prisma.$executeRaw`
      INSERT INTO subscription_links (id, tenant_id, plan, period, amount_in_minor, currency, code, status, email, created_at)
      VALUES (${id}, ${tenantId}, ${String(plan).toUpperCase()}, ${String(period).toUpperCase()}, ${amountInMinor}, 'INR', ${code}, 'PENDING', ${email||null}, NOW())
    `

    const base = process.env.NEXTAUTH_URL || 'http://localhost:3001'
    const payUrl = `${base.replace(/\/$/, '')}/billing/subscribe/${code}`

    // Determine recipient (explicit email or tenant.billingEmail)
    let recipient: string | null = email || null
    if (!recipient) {
      try {
        const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { billingEmail: true, name: true } })
        recipient = t?.billingEmail || null
      } catch {}
    }

    if (recipient) {
      try {
        await sendEmail({
          to: recipient,
          subject: 'Subscription Payment Link',
          html: `<p>Please complete your subscription for tenant <b>${tenantId}</b>.</p><p>Plan: <b>${String(plan).toUpperCase()}</b> (${String(period).toUpperCase()})</p><p>Amount: <b>₹${Number(amountInr).toLocaleString('en-IN')}</b></p><p><a href="${payUrl}">Click here to pay and activate</a></p>`
        })
      } catch (e) {
        console.warn('Failed to send subscription email:', e)
      }
    }

    return NextResponse.json({ id, code, payUrl })
  } catch (error: any) {
    console.error('Create subscription link error:', error)
    return NextResponse.json({ message: 'Failed to create link' }, { status: 500 })
  }
}
