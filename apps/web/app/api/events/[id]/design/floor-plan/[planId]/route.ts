import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; planId: string } }
) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = params

    // Delete floor plan using raw SQL since model is not defined in schema
    await prisma.$executeRaw`
      DELETE FROM floor_plan_configs
      WHERE id = ${BigInt(planId)}
    `

    return NextResponse.json({ success: true, message: 'Floor plan deleted' })
  } catch (error: any) {
    console.error('Delete floor plan error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
