
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
      // Normalize role to enum
      let dbRole = (role || 'STAFF').toUpperCase().replace(' ', '_')
      if (dbRole === 'EVENT_STAFF') dbRole = 'STAFF'
      if (dbRole === 'ADMIN') dbRole = 'ORGANIZER'
      if (!['OWNER', 'ORGANIZER', 'STAFF', 'VIEWER'].includes(dbRole)) dbRole = 'STAFF'

      try {
        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex')

        // Create or update invitation
        await prisma.$executeRaw`
          INSERT INTO event_team_invitations 
          (event_id, tenant_id, email, role, token, invited_by, status, expires_at)
          VALUES (
            ${eventIdString}, 
            ${tenantId}, 
            ${email}, 
            ${dbRole}, 
            ${token}, 
            ${session.user.id},
            'PENDING',
            NOW() + INTERVAL '7 days'
          )
          ON CONFLICT (event_id, email) 
          DO UPDATE SET 
            role = ${dbRole}, 
            token = ${token}, 
            status = 'PENDING',
            updated_at = NOW(),
            expires_at = NOW() + INTERVAL '7 days'
        `

        // Send invitation email with approve/reject links
        const approveUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/events/${eventIdString}/team/approve?token=${token}`
        const rejectUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/events/${eventIdString}/team/reject?token=${token}`

        await sendEmail({
          to: email,
          subject: `You're invited to collaborate on an event`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Event Team Invitation</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      
                      <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                            You're invited to collaborate on an event
                          </h1>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding: 40px 30px;">
                          <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
                            Hi ${email.split('@')[0]},
                          </p>
                          <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
                            You have been invited as <strong>${dbRole}</strong> to collaborate on <strong>${event.name}</strong>.
                          </p>
                          <p style="margin: 0 0 30px 0; color: #666; font-size: 14px;">
                            Approve your invite: <a href="${approveUrl}">${approveUrl}</a>
                          </p>
                          <p style="margin: 0 0 30px 0; color: #666; font-size: 14px;">
                            Reject this invite: <a href="${rejectUrl}">${rejectUrl}</a>
                          </p>
                          <p style="margin: 0; color: #666; font-size: 14px;">
                            Thanks,<br>Event Planner
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `
        }).catch(e => console.error('Email failed', e))

        results.push({ email, status: 'invited', token })

      } catch (err: any) {
        console.error(`Failed to create invitation for ${email}`, err)
        results.push({ email, status: 'failed', reason: err.message })
      }
    }

    return NextResponse.json({ message: 'Invites processed', results })

  } catch (error: any) {
    console.error('Invite error:', error)
    return NextResponse.json({ message: error?.message || 'Invite failed' }, { status: 500 })
  }
}
