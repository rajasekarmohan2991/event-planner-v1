
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = BigInt(params.id)
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    console.log(`🔍 [Tickets GET] Fetching for event: ${params.id}`)
    const tickets = await prisma.ticket.findMany({
      where: { eventId: eventId },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`✅ [Tickets GET] Found ${tickets.length} tickets`)

    const payload = tickets.map(t => ({
      id: t.id.toString(),
      eventId: t.eventId.toString(),
      groupId: t.groupId,
      name: t.name,
      description: t.description,
      // Ensure prices are numbers/strings for frontend
      priceInMinor: Number(t.priceInMinor),
      quantity: Number(t.quantity),
      sold: Number(t.sold || 0),
      status: t.status === 'ACTIVE' ? 'Open' : 'Closed',
      requiresApproval: t.requiresApproval,
      salesStartAt: t.salesStartAt,
      salesEndAt: t.salesEndAt,
      tenantId: t.tenantId
    }))

    return NextResponse.json(payload)
  } catch (e: any) {
    console.error('❌ [Tickets GET] Error:', e)
    return NextResponse.json({ message: e?.message || 'Load failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = BigInt(params.id)
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    console.log(`📌 [Tickets POST] Creating ticket for event: ${params.id}`)

    // Get tenantId
    const event = await prisma.event.findFirst({
      where: { id: eventId },
      select: { tenantId: true }
    })

    const ticket = await prisma.ticket.create({
      data: {
        eventId: eventId,
        tenantId: event?.tenantId || null,
        name: body.name,
        description: body.description,
        groupId: body.groupId,
        priceInMinor: body.price ? Math.round(Number(body.price) * 100) : (Number(body.priceInMinor) || 0),
        quantity: body.quantity ? Number(body.quantity) : (Number(body.capacity) || 0),
        status: body.status === 'Closed' ? 'INACTIVE' : 'ACTIVE',
        requiresApproval: !!body.requiresApproval,
        salesStartAt: body.salesStartDate ? new Date(body.salesStartDate + (body.salesStartTime ? 'T' + body.salesStartTime : '')) : null,
        salesEndAt: body.salesEndDate ? new Date(body.salesEndDate + (body.salesEndTime ? 'T' + body.salesEndTime : '')) : null,
      }
    })

    console.log(`✅ [Tickets POST] Success: ${ticket.id}`)

    return NextResponse.json({
      ...ticket,
      id: ticket.id.toString(),
      eventId: ticket.eventId.toString()
    })
  } catch (e: any) {
    console.error('❌ [Tickets POST] Error:', e)
    return NextResponse.json({ message: e?.message || 'Create failed' }, { status: 500 })
  }
}
