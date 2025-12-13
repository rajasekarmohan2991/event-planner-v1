import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NS = 'vendors'

type VendorStatus = 'booked' | 'pending' | 'cancelled'

export interface Vendor {
  id: string
  eventId: string
  name: string
  category: string
  contactName?: string
  email?: string
  phone?: string
  costInr?: number
  contract?: boolean
  status: VendorStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

async function loadVendors(eventId: string): Promise<Vendor[]> {
  const key = `event:${eventId}`
  const kv = await prisma.keyValue.findFirst({
    where: { namespace: NS, key },
    select: { value: true }
  })
  const list = (kv?.value as any)?.vendors || []
  return Array.isArray(list) ? list as Vendor[] : []
}

async function saveVendors(eventId: string, vendors: Vendor[]) {
  const key = `event:${eventId}`
  const payload: Prisma.JsonObject = { vendors: vendors as unknown as Prisma.JsonArray }
  await prisma.keyValue.upsert({
    where: { namespace_key: { namespace: NS, key } },
    create: { namespace: NS, key, value: payload as unknown as Prisma.InputJsonValue },
    update: { value: payload as unknown as Prisma.InputJsonValue }
  })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const vendors = await loadVendors(params.id)
    const totals = vendors.reduce((acc, v) => {
      acc.total += 1
      acc.totalCost += Number(v.costInr || 0)
      if (v.status === 'booked') acc.booked += 1
      return acc
    }, { total: 0, booked: 0, totalCost: 0 })

    return NextResponse.json({ vendors, stats: totals })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load vendors' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Optional: ensure authenticated organizer
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const eventId = params.id
    const body = await req.json()
    const now = new Date().toISOString()

    const vendor: Vendor = {
      id: body.id || crypto.randomUUID(),
      eventId,
      name: String(body.name || '').trim(),
      category: String(body.category || 'Other'),
      contactName: body.contactName || '',
      email: body.email || '',
      phone: body.phone || '',
      costInr: Number(body.costInr || 0),
      contract: Boolean(body.contract || false),
      status: (body.status || 'pending') as VendorStatus,
      notes: body.notes || '',
      createdAt: now,
      updatedAt: now,
    }

    if (!vendor.name) return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })

    const vendors = await loadVendors(eventId)
    vendors.push(vendor)
    await saveVendors(eventId, vendors)

    return NextResponse.json({ success: true, vendor })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to add vendor' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const eventId = params.id
    const body = await req.json()
    const { vendorId, status, contract } = body || {}
    if (!vendorId) return NextResponse.json({ error: 'vendorId is required' }, { status: 400 })

    const vendors = await loadVendors(eventId)
    const idx = vendors.findIndex(v => v.id === vendorId)
    if (idx === -1) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    if (status) vendors[idx].status = status
    if (typeof contract === 'boolean') vendors[idx].contract = contract
    vendors[idx].updatedAt = new Date().toISOString()

    await saveVendors(eventId, vendors)
    return NextResponse.json({ success: true, vendor: vendors[idx] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update vendor' }, { status: 500 })
  }
}
