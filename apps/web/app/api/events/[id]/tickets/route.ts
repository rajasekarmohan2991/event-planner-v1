
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const tickets = await prisma.ticket.findMany({
      where: { eventId: String(params.id) },
      orderBy: { createdAt: 'desc' }
    })

    // Map to format expected by frontend
    const payload = tickets.map(t => ({
      id: t.id,
      groupId: t.groupId,
      name: t.name,
      description: t.description,
      // Frontend expects price in minor units (paise/cents)
      priceInMinor: t.priceInr * 100,
      quantity: t.capacity,
      sold: t.sold,
      // Simple mapping for status
      status: t.status === 'ACTIVE' ? 'Open' : 'Closed',
      requiresApproval: t.requiresApproval,
      salesStartAt: t.salesStartAt,
      salesEndAt: t.salesEndAt,
      minQuantity: t.minQuantity,
      maxQuantity: t.maxQuantity,
      allowedUserTypes: t.allowedUserTypes
    }))

    return NextResponse.json(payload)
  } catch (e: any) {
    console.error('Tickets GET error:', e)
    return NextResponse.json({ message: 'Failed to load tickets' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    // Default values
    const priceInr = body.price ? Math.round(Number(body.price)) : 0
    const capacity = body.quantity ? Number(body.quantity) : 0

    const ticket = await prisma.ticket.create({
      data: {
        eventId: String(params.id),
        name: body.name,
        description: body.description,
        groupId: body.groupId,
        priceInr,
        capacity,
        // Status mapping
        status: body.status === 'Closed' ? 'INACTIVE' : 'ACTIVE',
        requiresApproval: !!body.requiresApproval,
        salesStartAt: body.salesStartDate ? new Date(body.salesStartDate + (body.salesStartTime ? 'T' + body.salesStartTime : '')) : null,
        salesEndAt: body.salesEndDate ? new Date(body.salesEndDate + (body.salesEndTime ? 'T' + body.salesEndTime : '')) : null,
        minQuantity: body.minBuyingLimit ? Number(body.minBuyingLimit) : 1,
        maxQuantity: body.maxBuyingLimit ? Number(body.maxBuyingLimit) : 10,
      }
    })

    // Return mapped object
    const payload = {
      id: ticket.id,
      groupId: ticket.groupId,
      name: ticket.name,
      description: ticket.description,
      priceInMinor: ticket.priceInr * 100,
      quantity: ticket.capacity,
      sold: ticket.sold,
      status: ticket.status === 'ACTIVE' ? 'Open' : 'Closed',
      requiresApproval: ticket.requiresApproval,
      salesStartAt: ticket.salesStartAt,
      salesEndAt: ticket.salesEndAt,
    }

    return NextResponse.json(payload)
  } catch (e: any) {
    console.error('Create ticket error:', e)
    return NextResponse.json({ message: e?.message || 'Create failed' }, { status: 500 })
  }
}
