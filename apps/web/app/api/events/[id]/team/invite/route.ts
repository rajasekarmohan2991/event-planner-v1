
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { emails, role } = body
    const eventIdString = params.id

    if (isNaN(Number(eventIdString))) {
      return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 })
    }
    const eventId = BigInt(eventIdString)

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ message: 'No emails provided' }, { status: 400 })
    }

    // 1. Fetch Event Tenant
    const events = await prisma.$queryRaw`
      SELECT id, name, tenant_id as "tenantId" 
      FROM events 
      WHERE id = ${eventId} 
      LIMIT 1
    ` as any[]

    if (!events.length) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const event = events[0]
    const tenantId = event.tenantId

    const results = []

    for (const email of emails) {
      let user = await prisma.user.findUnique({ where: { email } })
      let isNewUser = false

      if (!user) {
        try {
          user = await prisma.user.create({
            data: {
              name: email.split('@')[0],
              email: email,
              role: 'USER',
              currentTenantId: tenantId
            }
          })
          isNewUser = true
        } catch (err) {
          console.error(`Failed to create user ${email}`, err)
          results.push({ email, status: 'failed', reason: 'User creation failed' })
          continue
        }
      }

      // 2. Insert/Update Assignment (Raw SQL)

      // Normalize role to enum
      let dbRole = (role || 'STAFF').toUpperCase().replace(' ', '_')
      if (dbRole === 'EVENT_STAFF') dbRole = 'STAFF'
      if (dbRole === 'ADMIN') dbRole = 'ORGANIZER'
      if (!['OWNER', 'ORGANIZER', 'STAFF', 'VIEWER'].includes(dbRole)) dbRole = 'STAFF'

      try {
        await prisma.$executeRawUnsafe(`
            INSERT INTO "EventRoleAssignment" ("id", "eventId", "userId", "role", "tenantId", "createdAt")
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT ("eventId", "userId") 
            DO UPDATE SET "role" = $4, "tenantId" = $5
        `, crypto.randomUUID(), eventIdString, user.id, dbRole, tenantId)

        // Send Email
        if (isNewUser) {
          await sendEmail({
            to: email,
            subject: 'You have been invited to join an event team',
            text: `You have been invited to join the team for event "${event.name}". An account has been created for you.`,
            html: `<p>You have been invited to join the team for event <strong>${event.name}</strong>.</p>`
          }).catch(e => console.error('Email failed', e))
          results.push({ email, status: 'invited', note: 'Account created' })
        } else {
          await sendEmail({
            to: email,
            subject: 'You have been added to an event team',
            text: `You have been added to the team for event "${event.name}".`,
            html: `<p>You have been added to the team for event <strong>${event.name}</strong>.</p>`
          }).catch(e => console.error('Email failed', e))
          results.push({ email, status: 'added' })
        }

      } catch (err: any) {
        console.error(`Failed to assign role to ${email}`, err)
        results.push({ email, status: 'failed', reason: err.message })
      }
    }

    return NextResponse.json({ message: 'Invites processed', results })

  } catch (error: any) {
    console.error('Invite error:', error)
    return NextResponse.json({ message: error?.message || 'Invite failed' }, { status: 500 })
  }
}
