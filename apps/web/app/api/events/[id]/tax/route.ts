import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

const NS = 'event_tax_settings'

export type TaxSettings = {
  enabled: boolean
  gstNumber?: string | null
  taxInclusive: boolean
  ratePercent: number
  invoiceNotes?: string | null
}

const DEFAULTS: TaxSettings = {
  enabled: false,
  gstNumber: null,
  taxInclusive: true,
  ratePercent: 18,
  invoiceNotes: null,
}

function sanitize(input: any): TaxSettings {
  const v = input || {}
  return {
    enabled: Boolean(v.enabled ?? DEFAULTS.enabled),
    gstNumber: v.gstNumber ? String(v.gstNumber) : null,
    taxInclusive: Boolean(v.taxInclusive ?? DEFAULTS.taxInclusive),
    ratePercent: Math.max(0, Math.min(100, Number(v.ratePercent ?? DEFAULTS.ratePercent))),
    invoiceNotes: v.invoiceNotes ? String(v.invoiceNotes) : null,
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const allowed = await requireEventRole(params.id, ['STAFF','ORGANIZER','OWNER'])
    if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

    const kv = await prisma.keyValue.findUnique({
      where: { namespace_key: { namespace: NS, key: params.id } },
      select: { value: true },
    }).catch(() => null)

    return NextResponse.json(sanitize(kv?.value))
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to load tax settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const allowed = await requireEventRole(params.id, ['STAFF','ORGANIZER','OWNER'])
    if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const value = sanitize(body)

    const upsert = await prisma.keyValue.upsert({
      where: { namespace_key: { namespace: NS, key: params.id } },
      create: { namespace: NS, key: params.id, value },
      update: { value },
      select: { value: true },
    })
    return NextResponse.json(upsert.value)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to save tax settings' }, { status: 500 })
  }
}
