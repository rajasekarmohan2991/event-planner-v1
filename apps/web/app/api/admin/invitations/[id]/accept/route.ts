import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { sendEmail } from '@/lib/email'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { name, password } = await req.json()
        const inviteId = params.id

        // Get the team invite
        const invites = await prisma.$queryRaw<any[]>`
      SELECT 
        id,
        "tenantId",
        name as "invitedName",
        email,
        role,
        status,
        "invitedBy"
      FROM team_invites
      WHERE id = ${inviteId}
      LIMIT 1
    `

        if (invites.length === 0) {
            return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
        }

        const invite = invites[0]

        if (invite.status === 'ACCEPTED') {
            return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 })
        }

        if (invite.status === 'REJECTED') {
            return NextResponse.json({ error: 'Invitation was rejected' }, { status: 400 })
        }

        // Check if user already exists
        const existingUsers = await prisma.$queryRaw<any[]>`
      SELECT id FROM users WHERE email = ${invite.email} LIMIT 1
    `

        let userId: string

        if (existingUsers.length > 0) {
            // User exists, just update tenant membership
            userId = existingUsers[0].id
        } else {
            // Create new user account
            const hashedPassword = await bcrypt.hash(password || Math.random().toString(36).slice(-8) + 'Aa1!', 10)

            const newUsers = await prisma.$queryRaw<any[]>`
        INSERT INTO users (
          name, 
          email, 
          password_hash, 
          role, 
          created_at, 
          updated_at, 
          current_tenant_id, 
          email_verified
        )
        VALUES (
          ${name || invite.invitedName || invite.email.split('@')[0]},
          ${invite.email},
          ${hashedPassword},
          ${invite.role || 'USER'},
          NOW(),
          NOW(),
          ${invite.tenantId},
          NOW()
        )
        RETURNING id::text as id
      `

            userId = newUsers[0].id
        }

        // Add user to tenant as member
        await prisma.$executeRaw`
      INSERT INTO tenant_members ("tenantId", "userId", role, status, "invitedBy", "invitedAt", "joinedAt")
      VALUES (
        ${invite.tenantId},
        ${BigInt(userId)},
        ${invite.role || 'MEMBER'},
        'ACTIVE',
        ${invite.invitedBy ? BigInt(invite.invitedBy) : null},
        NOW(),
        NOW()
      )
      ON CONFLICT ("tenantId", "userId") 
      DO UPDATE SET 
        role = EXCLUDED.role, 
        status = 'ACTIVE',
        "joinedAt" = NOW()
    `

        // Update invite status to ACCEPTED
        await prisma.$executeRaw`
      UPDATE team_invites
      SET 
        status = 'ACCEPTED',
        "acceptedAt" = NOW()
      WHERE id = ${inviteId}
    `

        // Send welcome email
        try {
            await sendEmail({
                to: invite.email,
                subject: 'Welcome to the team!',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">🎉 Welcome!</h2>
            <p>Hi ${name || invite.invitedName},</p>
            <p>You've successfully accepted the team invitation and your account has been created.</p>
            <p>You can now sign in and start collaborating with your team!</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/auth/login" 
                 style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Sign In Now
              </a>
            </div>
          </div>
        `
            })
        } catch (emailError) {
            console.warn('Failed to send welcome email:', emailError)
        }

        return NextResponse.json({
            success: true,
            message: 'Invitation accepted successfully',
            userId,
            email: invite.email
        })

    } catch (error: any) {
        console.error('Error accepting team invitation:', error)
        return NextResponse.json({
            error: 'Failed to accept invitation',
            details: error.message
        }, { status: 500 })
    }
}
