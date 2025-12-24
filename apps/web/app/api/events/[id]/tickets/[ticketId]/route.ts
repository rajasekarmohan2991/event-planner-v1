
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PUT(req: NextRequest, { params }: { params: { id: string, ticketId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    // Default values logic similar to POST
    const priceInr = body.price !== undefined ? Math.round(Number(body.price)) : undefined
    const capacity = body.quantity !== undefined ? Number(body.quantity) : undefined

    const ticket = await prisma.ticket.update({
      where: { id: params.ticketId },
      data: {
        name: body.name,
        description: body.description,
        groupId: body.groupId,
        ...(priceInr !== undefined && { priceInr }),
        ...(capacity !== undefined && { capacity }),
        ...(body.status && { status: body.status === 'Closed' ? 'INACTIVE' : 'ACTIVE' }),
        ...(body.requiresApproval !== undefined && { requiresApproval: !!body.requiresApproval }),
        ...(body.salesStartDate && {
          salesStartAt: new Date(body.salesStartDate + (body.salesStartTime ? 'T' + body.salesStartTime : ''))
        }),
        ...(body.salesEndDate && {
          salesEndAt: new Date(body.salesEndDate + (body.salesEndTime ? 'T' + body.salesEndTime : ''))
        }),
        ...(body.minBuyingLimit && { minQuantity: Number(body.minBuyingLimit) }),
        ...(body.maxBuyingLimit && { maxQuantity: Number(body.maxBuyingLimit) }),
      }
    })

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
    console.error('Update ticket error:', e)
    return NextResponse.json({ message: e?.message || 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, ticketId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    await prisma.ticket.delete({
      where: { id: params.ticketId }
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Delete ticket error:', e)
    return NextResponse.json({ message: e?.message || 'Delete failed' }, { status: 500 })
  }
}
