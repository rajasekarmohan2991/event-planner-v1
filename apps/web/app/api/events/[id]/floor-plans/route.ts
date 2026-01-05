import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const dynamic = 'force-dynamic'

const bigIntReplacer = (key: string, value: any) =>
  typeof value === 'bigint' ? value.toString() : value

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const eventId = BigInt(params.id)
    const plans = await prisma.floorPlanConfig.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' }
    })

    // Map to format expected by Frontend
    const mapped = plans.map(p => ({
      id: p.id.toString(),
      eventId: p.eventId.toString(),
      ticketClass: p.planName, // Map planName to ticketClass
      layoutConfig: p.layoutData, // Map layoutData to layoutConfig
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }))

    return NextResponse.json(JSON.parse(JSON.stringify(mapped, bigIntReplacer)))
  } catch (e: any) {
    console.error('Failed to list floor plans:', e)
    return NextResponse.json({ message: e?.message || 'Failed to list floor plans' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const eventId = BigInt(params.id)
    const body = await req.json()
    const { ticketClass, layoutConfig } = body

    if (!ticketClass) {
      return NextResponse.json({ message: 'Ticket class is required' }, { status: 400 })
    }

    // Upsert the configuration
    const plan = await prisma.floorPlanConfig.upsert({
      where: {
        eventId_planName: {
          eventId,
          planName: ticketClass
        }
      },
      create: {
        eventId,
        planName: ticketClass,
        layoutData: layoutConfig || {},
        totalSeats: (layoutConfig?.rows || 0) * (layoutConfig?.cols || 0)
      },
      update: {
        layoutData: layoutConfig || {},
        totalSeats: (layoutConfig?.rows || 0) * (layoutConfig?.cols || 0),
        updatedAt: new Date()
      }
    })

    const mapped = {
      id: plan.id.toString(),
      eventId: plan.eventId.toString(),
      ticketClass: plan.planName,
      layoutConfig: plan.layoutData,
      createdAt: plan.createdAt
    }

    return NextResponse.json(JSON.parse(JSON.stringify(mapped, bigIntReplacer)))

  } catch (e: any) {
    console.error('Failed to save floor plan:', e)
    return NextResponse.json({ message: e?.message || 'Failed to save floor plan' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const ticketClass = searchParams.get('ticketClass')
    const eventId = BigInt(params.id)

    if (!ticketClass) {
      return NextResponse.json({ message: 'Ticket class is required' }, { status: 400 })
    }

    await prisma.floorPlanConfig.deleteMany({
      where: {
        eventId,
        planName: ticketClass
      }
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Failed to delete floor plan:', e)
    return NextResponse.json({ message: e?.message || 'Failed to delete floor plan' }, { status: 500 })
  }
}
