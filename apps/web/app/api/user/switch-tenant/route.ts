import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = await req.json()

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
    }

    // Verify user has access to this tenant
    const membership = await prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: BigInt(session.user.id)
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this tenant' },
        { status: 403 }
      )
    }

    // Update user's current tenant
    await prisma.user.update({
      where: { id: BigInt(session.user.id) },
      data: { currentTenantId: tenantId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Switch tenant error:', error)
    return NextResponse.json(
      { error: 'Failed to switch tenant' },
      { status: 500 }
    )
  }
}
