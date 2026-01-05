import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const body = await req.json()
    const { name, subject, htmlContent, textContent } = body

    if (!name || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'name, subject, and htmlContent are required' },
        { status: 400 }
      )
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        eventId,
        name,
        subject,
        htmlContent,
        textContent,
        createdById: BigInt((session.user as any).id),
      },
    })

    return NextResponse.json(campaign)
  } catch (error: any) {
    console.error('Create campaign error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id

    const campaigns = await prisma.emailCampaign.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(campaigns)
  } catch (error: any) {
    console.error('Get campaigns error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
