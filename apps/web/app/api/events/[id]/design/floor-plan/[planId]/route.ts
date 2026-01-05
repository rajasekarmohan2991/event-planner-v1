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
    console.log(`[FLOOR PLAN DELETE] Deleting floor plan: ${planId}`)

    // Use Prisma model to delete floor plan
    await prisma.floorPlan.delete({
      where: { id: planId }
    })

    console.log(`[FLOOR PLAN DELETE] Successfully deleted: ${planId}`)
    return NextResponse.json({ success: true, message: 'Floor plan deleted' })
  } catch (error: any) {
    console.error('[FLOOR PLAN DELETE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
