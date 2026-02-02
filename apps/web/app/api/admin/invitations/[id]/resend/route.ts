import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import { sendEmail } from '@/lib/email'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has permission to send invitations
    const permissionCheck = await checkPermissionInRoute('communication.send_email')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get invitation details
    const invitationResult = await prisma.$queryRaw`
      SELECT 
        i.id,
        i.email,
        i.name,
        i.event_id as "eventId",
        i.promo_code as "promoCode",
        i.eligibility_reason as "eligibilityReason",
        i.status,
        pc.discount_type as "discountType",
        pc.discount_value as "discountValue",
        pc.description as "promoDescription"
      FROM invitations i
      LEFT JOIN promo_codes pc ON pc.code = i.promo_code
      WHERE i.id = ${params.id}
    `

    const invitation = (invitationResult as any)[0]
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Generate invitation email
    const invitationUrl = `${process.env.NEXTAUTH_URL}/invitation/${invitation.id}`
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">🎉 Reminder: You're Invited!</h2>
        
        <p>Hi ${invitation.name || 'there'},</p>
        
        <p>This is a friendly reminder about your invitation based on: <strong>${invitation.eligibilityReason}</strong></p>
        
        ${invitation.promoCode ? `
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <h3 style="margin: 0 0 10px 0; color: #0c4a6e;">🎁 Your Exclusive Offer is Still Available!</h3>
            <p style="margin: 0 0 10px 0;">Use promo code: <strong style="font-size: 18px; color: #0ea5e9;">${invitation.promoCode}</strong></p>
            <p style="margin: 0; color: #64748b;">
              Get ${invitation.discountType === 'PERCENT' ? `${invitation.discountValue}% off` : `₹${invitation.discountValue} discount`}
              ${invitation.promoDescription ? ` - ${invitation.promoDescription}` : ''}
            </p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Accept Invitation & Get Started
          </a>
        </div>
        
        <p>Don't miss out on this opportunity! Click the button above to create your account.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 12px;">
          This is a reminder for your personalized invitation.
        </p>
      </div>
    `

    // Send email
    await sendEmail({
      to: invitation.email,
      subject: `🔔 Reminder: Your Invitation ${invitation.promoCode ? `+ ${invitation.promoCode} Promo Code` : ''}`,
      html: emailContent,
      text: `Reminder: You're invited! ${invitation.promoCode ? `Use promo code: ${invitation.promoCode}` : ''} Visit: ${invitationUrl}`
    })

    // Update invitation status and sent_at
    await prisma.$executeRaw`
      UPDATE invitations 
      SET status = 'SENT', sent_at = NOW()
      WHERE id = ${params.id}
    `

    return NextResponse.json({ success: true, message: 'Invitation resent successfully' })

  } catch (error: any) {
    console.error('Error resending invitation:', error)
    return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 })
  }
}
