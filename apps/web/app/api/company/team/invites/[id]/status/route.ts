import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH - Update invite status (APPROVED/REJECTED)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const tenantId = (session.user as any).currentTenantId
    const { status } = await req.json()

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update invite status
    const invite = await prisma.teamInvite.update({
      where: { 
        id: params.id,
        tenantId: tenantId
      },
      data: {
        status,
        respondedAt: new Date()
      }
    })

    // If approved, create tenant member
    if (status === 'APPROVED') {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email: invite.email }
      })

      // If user doesn't exist, they'll need to register first
      // For now, just mark as approved and they can join when they register

      if (user) {
        // Check if already a member
        const existingMember = await prisma.tenantMember.findFirst({
          where: {
            userId: user.id,
            tenantId: tenantId
          }
        })

        if (!existingMember) {
          // Add as tenant member
          await prisma.tenantMember.create({
            data: {
              userId: user.id,
              tenantId: tenantId,
              role: invite.role,
              status: 'ACTIVE',
              invitedBy: invite.invitedBy
            }
          })

          // Update user's current tenant if they don't have one
          if (!user.currentTenantId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { currentTenantId: tenantId }
            })
          }
        }
      }
    }

    return NextResponse.json({ success: true, invite })
  } catch (error: any) {
    console.error('Error updating invite status:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
