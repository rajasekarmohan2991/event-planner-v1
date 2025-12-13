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
  contractUrl?: string
  status: VendorStatus
  notes?: string
  attachments?: { id: string; url: string; name?: string; kind?: string; uploadedAt: string }[]
  createdAt: string
  updatedAt: string
}

// DELETE /api/events/[id]/vendors - Remove a vendor by id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const eventId = params.id
    const body = await req.json().catch(()=>({}))
    const { vendorId } = body as any
    if (!vendorId) return NextResponse.json({ error: 'vendorId is required' }, { status: 400 })

    const vendors = await loadVendors(eventId)
    const idx = vendors.findIndex(v => v.id === vendorId)
    if (idx === -1) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    const removed = vendors.splice(idx, 1)[0]
    await saveVendors(eventId, vendors)
    await appendLog(eventId, vendorId, { type: 'deleted', by: (session as any)?.user?.email || null, data: { id: vendorId, name: removed?.name } })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete vendor' }, { status: 500 })
  }
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

async function appendLog(eventId: string, vendorId: string, entry: any) {
  const key = `event:${eventId}:vendor:${vendorId}`
  const existing = await prisma.keyValue.findFirst({
    where: { namespace: 'vendor_logs', key },
    select: { value: true }
  })
  const arr = Array.isArray(existing?.value) ? (existing!.value as any[]) : []
  arr.push({ t: new Date().toISOString(), ...entry })
  await prisma.keyValue.upsert({
    where: { namespace_key: { namespace: 'vendor_logs', key } },
    create: { namespace: 'vendor_logs', key, value: arr as unknown as Prisma.InputJsonValue },
    update: { value: arr as unknown as Prisma.InputJsonValue }
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
      contractUrl: body.contractUrl || '',
      status: (body.status || 'pending') as VendorStatus,
      notes: body.notes || '',
      attachments: [],
      createdAt: now,
      updatedAt: now,
    }

    if (!vendor.name) return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 })

    const vendors = await loadVendors(eventId)
    vendors.push(vendor)
    await saveVendors(eventId, vendors)

    // Timeline log
    await appendLog(eventId, vendor.id, { type: 'created', by: (session as any)?.user?.email || null, data: vendor })

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
    const { vendorId } = body || {}
    if (!vendorId) return NextResponse.json({ error: 'vendorId is required' }, { status: 400 })

    const vendors = await loadVendors(eventId)
    const idx = vendors.findIndex(v => v.id === vendorId)
    if (idx === -1) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })

    // Attachments: add/remove fast paths
    if (body?.addAttachment) {
      const att = body.addAttachment as { id?: string; url: string; name?: string; kind?: string }
      if (!att?.url) return NextResponse.json({ error: 'Attachment url is required' }, { status: 400 })
      const newAtt = {
        id: att.id || crypto.randomUUID(),
        url: String(att.url),
        name: att.name ? String(att.name) : undefined,
        kind: att.kind ? String(att.kind) : undefined,
        uploadedAt: new Date().toISOString()
      }
      vendors[idx].attachments = Array.isArray(vendors[idx].attachments) ? vendors[idx].attachments : []
      vendors[idx].attachments!.push(newAtt)
      vendors[idx].updatedAt = new Date().toISOString()
      await saveVendors(eventId, vendors)
      await appendLog(eventId, vendorId, { type: 'attachment_added', by: (session as any)?.user?.email || null, attachment: newAtt })
      return NextResponse.json({ success: true, vendor: vendors[idx] })
    }

    if (body?.removeAttachmentId) {
      const removeId = String(body.removeAttachmentId)
      vendors[idx].attachments = (vendors[idx].attachments || []).filter(a => a.id !== removeId)
      vendors[idx].updatedAt = new Date().toISOString()
      await saveVendors(eventId, vendors)
      await appendLog(eventId, vendorId, { type: 'attachment_removed', by: (session as any)?.user?.email || null, id: removeId })
      return NextResponse.json({ success: true, vendor: vendors[idx] })
    }

    const before = { ...vendors[idx] }
    const updatable: (keyof Vendor)[] = ['name','category','contactName','email','phone','costInr','contract','contractUrl','status','notes']
    for (const key of updatable) {
      if (key in body && body[key] !== undefined) {
        // @ts-ignore
        vendors[idx][key] = body[key]
      }
    }
    vendors[idx].updatedAt = new Date().toISOString()

    await saveVendors(eventId, vendors)
    const after = vendors[idx]
    const changes: Record<string, any> = {}
    for (const key of updatable) {
      // @ts-ignore
      if (before[key] !== after[key]) changes[key as string] = { from: before[key], to: after[key] }
    }
    if (Object.keys(changes).length > 0) {
      await appendLog(eventId, vendorId, { type: 'updated', by: (session as any)?.user?.email || null, changes })
    }
    if (before.status !== vendors[idx].status && body?.reason) {
      await appendLog(eventId, vendorId, { type: 'status_changed', by: (session as any)?.user?.email || null, from: before.status, to: vendors[idx].status, reason: body.reason })
    }
    if ((before.contract && !vendors[idx].contract) || (!!before.contractUrl && !vendors[idx].contractUrl)) {
      await appendLog(eventId, vendorId, { type: 'contract_removed', by: (session as any)?.user?.email || null })
    }
    return NextResponse.json({ success: true, vendor: after })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update vendor' }, { status: 500 })
  }
}
