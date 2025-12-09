import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT - Update team invite
export async function PUT(
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
    const { name, email, role } = await req.json()

    // Update invite
    const invite = await prisma.teamInvite.update({
      where: { 
        id: params.id,
        tenantId: tenantId // Ensure user can only update their company's invites
      },
      data: {
        name,
        email: email.toLowerCase(),
        role
      }
    })

    return NextResponse.json({ 
      success: true, 
      invite: {
        ...invite,
        invitedBy: invite.invitedBy.toString()
      }
    })
  } catch (error: any) {
    console.error('Error updating team invite:', error)
    return NextResponse.json({ error: 'Failed to update invite' }, { status: 500 })
  }
}

// DELETE - Delete team invite
export async function DELETE(
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

    // Delete invite
    await prisma.teamInvite.delete({
      where: { 
        id: params.id,
        tenantId: tenantId // Ensure user can only delete their company's invites
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting team invite:', error)
    return NextResponse.json({ error: 'Failed to delete invite' }, { status: 500 })
  }
}
