import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendInviteEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// GET - Fetch all team invites for the company
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const tenantId = (session.user as any).currentTenantId
    
    if (!tenantId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    // Fetch team invites from database
    const invites = await prisma.teamInvite.findMany({
      where: { tenantId },
      orderBy: { invitedAt: 'desc' }
    })

    // Serialize BigInts
    const serializedInvites = invites.map(invite => ({
      ...invite,
      invitedBy: invite.invitedBy.toString()
    }))

    return NextResponse.json({ invites: serializedInvites })
  } catch (error: any) {
    console.error('Error fetching team invites:', error)
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 })
  }
}

// POST - Create new team invite
export async function POST(req: NextRequest) {
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
    
    if (!tenantId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 })
    }

    const { name, email, role } = await req.json()

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      // Check if already a member
      const existingMember = await prisma.tenantMember.findFirst({
        where: {
          userId: existingUser.id,
          tenantId: tenantId
        }
      })

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a team member' }, { status: 409 })
      }
    }

    // Check for existing pending invite
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        email: email.toLowerCase(),
        tenantId: tenantId,
        status: 'PENDING'
      }
    })

    if (existingInvite) {
      // Be idempotent: treat existing pending invite as success to avoid blocking UI
      return NextResponse.json({ 
        success: true, 
        duplicate: true,
        invite: {
          ...existingInvite,
          invitedBy: existingInvite.invitedBy.toString()
        },
        message: 'Invite already sent to this email'
      })
    }

    // Create team invite
    const invite = await prisma.teamInvite.create({
      data: {
        name,
        email: email.toLowerCase(),
        role,
        status: 'PENDING',
        tenantId,
        invitedBy: BigInt((session.user as any).id)
      }
    })

    // Fetch tenant details for email
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true }
    })
    
    const companyName = tenant?.name || 'Event Planner'
    const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/auth/register?invite=${invite.id}`

    // Send email notification to invitee
    try {
      await sendInviteEmail(email, name, inviteLink, companyName)
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError)
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({ 
      success: true, 
      invite: {
        ...invite,
        invitedBy: invite.invitedBy.toString()
      },
      message: 'Invitation sent successfully' 
    })
  } catch (error: any) {
    console.error('Error creating team invite:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}
