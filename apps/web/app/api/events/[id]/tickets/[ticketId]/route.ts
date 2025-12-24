import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma, { safeJson } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string, ticketId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const ticketId = BigInt(params.ticketId)

    // Mapping fields
    const priceInMinor = body.price !== undefined ? Math.round(Number(body.price) * 100) : (body.priceInMinor !== undefined ? body.priceInMinor : undefined)
    const quantity = body.quantity !== undefined ? Number(body.quantity) : (body.capacity !== undefined ? body.capacity : undefined)

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        name: body.name,
        description: body.description,
        groupId: body.groupId,
        ...(priceInMinor !== undefined && { priceInMinor: Number(priceInMinor) }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(body.status && { status: body.status === 'Closed' ? 'INACTIVE' : 'ACTIVE' }),
        ...(body.requiresApproval !== undefined && { requiresApproval: !!body.requiresApproval }),
        ...(body.salesStartDate && {
          salesStartAt: new Date(body.salesStartDate + (body.salesStartTime ? 'T' + body.salesStartTime : ''))
        }),
        ...(body.salesEndDate && {
          salesEndAt: new Date(body.salesEndDate + (body.salesEndTime ? 'T' + body.salesEndTime : ''))
        }),
      }
    })

    return NextResponse.json({
      ...ticket,
      id: ticket.id.toString(),
      eventId: ticket.eventId.toString(),
      priceInMinor: Number(ticket.priceInMinor),
      quantity: Number(ticket.quantity)
    })
  } catch (e: any) {
    console.error('❌ [Ticket Update Error]:', e)
    return NextResponse.json({ message: e?.message || 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, ticketId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const ticketId = BigInt(params.ticketId)
    await prisma.ticket.delete({
      where: { id: ticketId }
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Delete ticket error:', e)
    return NextResponse.json({ message: e?.message || 'Delete failed' }, { status: 500 })
  }
}
