import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import { sendEmail } from '@/lib/email'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    // Check if user has permission to view invitations
    const permissionCheck = await checkPermissionInRoute('communication.send_email')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch invitations from database
    const invitations = await prisma.$queryRaw`
      SELECT 
        i.id,
        i.email,
        i.name,
        i.event_id as "eventId",
        i.promo_code as "promoCode",
        i.eligibility_reason as "eligibilityReason",
        i.status,
        i.sent_at as "sentAt",
        i.accepted_at as "acceptedAt",
        i.created_at as "createdAt"
      FROM invitations i
      ORDER BY i.created_at DESC
    `

    return NextResponse.json(invitations)

  } catch (error: any) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user has permission to send invitations
    const permissionCheck = await checkPermissionInRoute('communication.send_email')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { emails, names, eventId, promoCodeId, eligibilityReason, customMessage, tenantId, role, autoCreateUser } = await req.json()
    const effectiveTenantId = tenantId || ((session.user as any)?.currentTenantId) || process.env.DEFAULT_TENANT_ID || 'default-tenant'
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Emails array is required' }, { status: 400 })
    }

    if (!eligibilityReason) {
      return NextResponse.json({ error: 'Eligibility reason is required' }, { status: 400 })
    }

    // Get promo code details if provided
    let promoCode = null
    if (promoCodeId) {
      const promoCodeResult = await prisma.$queryRaw`
        SELECT code, discount_type as "discountType", discount_value as "discountValue", description
        FROM promo_codes 
        WHERE id = ${promoCodeId} AND is_active = true
      `
      promoCode = (promoCodeResult as any)[0] || null
    }

    let sentCount = 0
    const results = []

    // Process each email
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i]
      const name = names && names[i] ? names[i] : null

      try {
        // Create invitation record
        const invitation = await prisma.$queryRaw`
          INSERT INTO invitations (
            email, name, event_id, promo_code, eligibility_reason, status, created_at
          )
          VALUES (
            ${email}, ${name}, ${eventId ? parseInt(eventId) : null}, 
            ${promoCode?.code || null}, ${eligibilityReason}, 'PENDING', NOW()
          )
          RETURNING id, email, name, promo_code as "promoCode"
        `

        const invitationRecord = (invitation as any)[0]

        // Generate invitation email
        const invitationUrl = `${process.env.NEXTAUTH_URL}/invitation/${invitationRecord.id}`
        
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">🎉 You're Invited!</h2>
            
            <p>Hi ${name || 'there'},</p>
            
            <p>You've been specially selected to join our platform based on: <strong>${eligibilityReason}</strong></p>
            
            ${promoCode ? `
              <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                <h3 style="margin: 0 0 10px 0; color: #0c4a6e;">🎁 Exclusive Offer Just for You!</h3>
                <p style="margin: 0 0 10px 0;">Use promo code: <strong style="font-size: 18px; color: #0ea5e9;">${promoCode.code}</strong></p>
                <p style="margin: 0; color: #64748b;">
                  Get ${promoCode.discountType === 'PERCENT' ? `${promoCode.discountValue}% off` : `₹${promoCode.discountValue} discount`}
                  ${promoCode.description ? ` - ${promoCode.description}` : ''}
                </p>
              </div>
            ` : ''}
            
            ${customMessage ? `
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-style: italic;">${customMessage}</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Accept Invitation & Get Started
              </a>
            </div>
            
            <p>This invitation is personalized for you. Click the button above to create your account and start exploring!</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px;">
              This invitation was sent because you meet our eligibility criteria: ${eligibilityReason}
            </p>
          </div>
        `

        // Send email
        await sendEmail({
          to: email,
          subject: `🎉 You're Invited! ${promoCode ? `+ Exclusive ${promoCode.code} Promo Code` : ''}`,
          html: emailContent,
          text: `You're invited! ${promoCode ? `Use promo code: ${promoCode.code}` : ''} Visit: ${invitationUrl}`
        })

        // Update invitation status
        await prisma.$executeRaw`
          UPDATE invitations 
          SET status = 'SENT', sent_at = NOW()
          WHERE id = ${invitationRecord.id}
        `

        // If a tenantId is provided, auto-link existing users to the company as members
        if (effectiveTenantId) {
          try {
            const users = await prisma.$queryRaw<any[]>`
              SELECT id FROM users WHERE email = ${email} LIMIT 1
            `
            if (users.length > 0) {
              const userId = BigInt(users[0].id)
              await prisma.$executeRaw`
                INSERT INTO tenant_members ("tenantId", "userId", role, status, "invitedAt", "joinedAt")
                VALUES (
                  ${effectiveTenantId},
                  ${userId},
                  ${role || 'MEMBER'},
                  'ACTIVE',
                  NOW(),
                  NOW()
                )
                ON CONFLICT ("tenantId", "userId") DO UPDATE SET role = EXCLUDED.role, status = 'ACTIVE'
              `
            } else {
              if (autoCreateUser) {
                // Create a basic user account and link to tenant
                const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!'
                const hashedPassword = await bcrypt.hash(tempPassword, 10)
                const created = await prisma.$queryRaw<any[]>`
                  INSERT INTO users (name, email, password_hash, role, created_at, updated_at, current_tenant_id, email_verified)
                  VALUES (
                    ${name || email.split('@')[0]},
                    ${email},
                    ${hashedPassword},
                    ${role || 'USER'},
                    NOW(), NOW(),
                    ${effectiveTenantId},
                    NOW()
                  )
                  RETURNING id::text as id, name, email
                `
                const newUser = created[0]
                await prisma.$executeRaw`
                  INSERT INTO tenant_members ("tenantId", "userId", role, status, "invitedAt", "joinedAt")
                  VALUES (${effectiveTenantId}, ${BigInt(newUser.id)}, ${role || 'MEMBER'}, 'ACTIVE', NOW(), NOW())
                  ON CONFLICT ("tenantId", "userId") DO UPDATE SET role = EXCLUDED.role, status = 'ACTIVE'
                `
                // Inform the user about their account creation
                try {
                  await sendEmail({
                    to: email,
                    subject: `You've been added to ${effectiveTenantId}`,
                    html: `<p>Hi ${name || ''},</p><p>An account has been created for you and added to the company. You can sign in with your email. If you didn't receive a password setup email, use Forgot Password to set a new one.</p>`
                  })
                } catch {}
              } else {
                // Store a team_invites row for visibility if user doesn't exist yet
                await prisma.$executeRaw`
                  INSERT INTO team_invites ("tenantId", name, email, role, status, "invitedBy", "invitedAt")
                  VALUES (
                    ${effectiveTenantId},
                    ${name},
                    ${email},
                    ${role || 'MEMBER'},
                    'PENDING',
                    ${BigInt((session as any).user.id)},
                    NOW()
                  )
                `
              }
            }
          } catch (linkErr) {
            console.warn('Tenant membership link failed for invite:', email, linkErr)
          }
        }

        sentCount++
        results.push({ email, status: 'sent', invitationId: invitationRecord.id })

      } catch (error) {
        console.error(`Failed to send invitation to ${email}:`, error)
        results.push({ email, status: 'failed', error: String(error) })
      }
    }

    return NextResponse.json({ 
      sent: sentCount,
      total: emails.length,
      results
    })

  } catch (error: any) {
    console.error('Error sending invitations:', error)
    return NextResponse.json({ error: 'Failed to send invitations' }, { status: 500 })
  }
}
