import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const token = req.headers.get('x-seed-token') || ''
    const expected = process.env.SEED_TOKEN || ''
    if (!expected) {
      return NextResponse.json({ error: 'SEED_TOKEN not configured' }, { status: 500 })
    }
    if (token !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const baseUrl = process.env.DATABASE_URL || ''
    if (!baseUrl) {
      return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
    }
    // Ensure pgbouncer mode to disable prepared statements and avoid "prepared statement s0 already exists"
    const sep = baseUrl.includes('?') ? '&' : '?'
    const url = `${baseUrl}${sep}pgbouncer=true&connection_limit=1&sslmode=require`
    const prisma = new PrismaClient({ datasources: { db: { url } } })

    const tenantId = process.env.DEFAULT_TENANT_ID || 'demo-tenant'

    const tenant = await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: {
        id: tenantId,
        slug: 'demo',
        name: 'Demo Tenant',
        subdomain: 'demo',
      },
    })

    await prisma.$disconnect()
    return NextResponse.json({ ok: true, id: tenant.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Seed failed' }, { status: 500 })
  }
}
