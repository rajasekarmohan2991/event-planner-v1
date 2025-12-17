import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Helper to serialize BigInt
const bigIntReplacer = (key: string, value: any) =>
  typeof value === 'bigint' ? value.toString() : value

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const eventId = BigInt(params.id)
    const plans = await prisma.floorPlanConfig.findMany({
      where: { eventId },
      select: {
        id: true,
        planName: true,
        layoutData: true,
        totalSeats: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ floorPlans: JSON.parse(JSON.stringify(plans, bigIntReplacer)) })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to list floor plans' }, { status: 500 })
  }
}
