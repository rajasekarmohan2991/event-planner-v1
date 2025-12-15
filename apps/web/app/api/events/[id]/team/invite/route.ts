
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    // if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { emails, role } = body // emails is string[]
    const eventId = params.id

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ message: 'No emails provided' }, { status: 400 })
    }

    const results = []

    for (const email of emails) {
      // 1. Check if user already exists
      const user = await prisma.user.findUnique({ where: { email } })

      if (user) {
        // 2. If exists, assign role directly to EventRoleAssignment
        await prisma.eventRoleAssignment.upsert({
          where: {
            eventId_userId: {
              eventId: eventId,
              userId: user.id
            }
          },
          update: { role: 'STAFF' }, // Map 'Event Staff' etc to enum if needed. using STAFF for now.
          create: {
            eventId: eventId,
            userId: user.id,
            role: 'STAFF'
          }
        })

        // 3. Send email to existing user
        await sendEmail({
          to: email,
          subject: 'You have been added to an event team',
          text: `You have been added to the event team for event ID ${eventId}. Log in to view details.`,
          html: `<p>You have been added to the event team for event ID ${eventId}. Log in to view details.</p>`
        })

        results.push({ email, status: 'added' })
      } else {
        // 4. If user doesn't exist, we can't create EventRoleAssignment yet (FK constraint).
        // We just send an invite email. Real implementation would need an 'Invites' table.

        await sendEmail({
          to: email,
          subject: 'You have been invited to join an event team',
          text: `You have been invited to join the team for event ID ${eventId}. Please sign up at ${process.env.NEXTAUTH_URL}/auth/signup`,
          html: `<p>You have been invited to join the team for event ID ${eventId}. Please sign up at <a href="${process.env.NEXTAUTH_URL}/auth/signup">${process.env.NEXTAUTH_URL}/auth/signup</a></p>`
        })

        results.push({ email, status: 'invited' })
      }
    }

    return NextResponse.json({ message: 'Invites processed', results })
  } catch (e: any) {
    console.error('Invite error:', e)
    return NextResponse.json({ message: e?.message || 'Invite failed' }, { status: 500 })
  }
}
