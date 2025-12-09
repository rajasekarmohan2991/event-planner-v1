import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/registration-drafts - Get draft
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'eventId required' }, { status: 400 })
    }

    const where: any = { 
      eventId: BigInt(eventId),
      expiresAt: { gte: new Date() }
    }
    
    if (session?.user) {
      where.userId = BigInt((session as any).user.id)
    }

    const draft = await prisma.registrationDraft.findFirst({
      where,
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ draft })
  } catch (error: any) {
    console.error('Error fetching draft:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch draft',
      message: error.message
    }, { status: 500 })
  }
}

// POST /api/registration-drafts - Save draft
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    const body = await req.json()
    const { eventId, type, formData, ticketPrice, promoCode } = body

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour expiry

    const draft = await prisma.registrationDraft.create({
      data: {
        eventId: BigInt(eventId),
        userId: session?.user ? BigInt((session as any).user.id) : null,
        sessionId: session?.user ? null : body.sessionId,
        type,
        formData,
        ticketPrice,
        promoCode,
        expiresAt
      }
    })

    return NextResponse.json({ draft })
  } catch (error: any) {
    console.error('Error saving draft:', error)
    return NextResponse.json({ 
      error: 'Failed to save draft',
      message: error.message
    }, { status: 500 })
  }
}

// DELETE /api/registration-drafts - Delete draft
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const draftId = searchParams.get('id')

    if (!draftId) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    await prisma.registrationDraft.delete({
      where: { id: draftId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting draft:', error)
    return NextResponse.json({ 
      error: 'Failed to delete draft',
      message: error.message
    }, { status: 500 })
  }
}
