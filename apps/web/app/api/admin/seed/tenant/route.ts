import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

    return NextResponse.json({ ok: true, id: tenant.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Seed failed' }, { status: 500 })
  }
}
