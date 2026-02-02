import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/error?message=Invalid invitation link', req.url))
    }

    // 1. Find invitation by token
    const invitations = await prisma.$queryRaw`
      SELECT * FROM event_team_invitations 
      WHERE token = ${token} AND event_id = ${params.id}
      LIMIT 1
    ` as any[]

    if (!invitations.length) {
      return NextResponse.redirect(new URL('/error?message=Invitation not found', req.url))
    }

    const invitation = invitations[0]

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await prisma.$executeRaw`
        UPDATE event_team_invitations 
        SET status = 'EXPIRED', updated_at = NOW()
        WHERE token = ${token}
      `
      return NextResponse.redirect(new URL('/error?message=Invitation has expired', req.url))
    }

    // Check if already processed
    if (invitation.status !== 'PENDING') {
      return NextResponse.redirect(new URL(`/events/${params.id}?message=Invitation already ${invitation.status.toLowerCase()}`, req.url))
    }

    // 2. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: invitation.email }
    })

    if (!user) {
      // 3. User doesn't exist → Redirect to signup with token
      const signupUrl = new URL('/auth/signup', req.url)
      signupUrl.searchParams.set('email', invitation.email)
      signupUrl.searchParams.set('token', token)
      signupUrl.searchParams.set('event', params.id)
      return NextResponse.redirect(signupUrl)
    }

    // 4. User exists → Assign role and approve
    try {
      // Assign role to user
      await prisma.eventRoleAssignment.upsert({
        where: {
          eventId_userId: {
            eventId: params.id,
            userId: user.id
          }
        },
        update: {
          role: invitation.role as any,
          tenantId: invitation.tenant_id
        },
        create: {
          eventId: params.id,
          userId: user.id,
          role: invitation.role as any,
          tenantId: invitation.tenant_id
        }
      })

      // 5. Update invitation status
      await prisma.$executeRaw`
        UPDATE event_team_invitations 
        SET status = 'APPROVED', updated_at = NOW()
        WHERE token = ${token}
      `

      // 6. Redirect to event page
      return NextResponse.redirect(new URL(`/events/${params.id}?invited=true&message=You have joined the event team!`, req.url))
    } catch (error: any) {
      console.error('Failed to assign role:', error)
      return NextResponse.redirect(new URL('/error?message=Failed to join event team', req.url))
    }

  } catch (error: any) {
    console.error('Approve error:', error)
    return NextResponse.redirect(new URL('/error?message=Something went wrong', req.url))
  }
}
