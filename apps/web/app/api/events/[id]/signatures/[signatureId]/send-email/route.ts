import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/signatures/[signatureId]/send-email
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string; signatureId: string }> | { id: string; signatureId: string } }
) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Await params if it's a Promise (Next.js 15+)
        const params = 'then' in context.params ? await context.params : context.params
        const { link } = await req.json()

        // Get signature request details
        const signature = await prisma.$queryRaw<any[]>`
      SELECT 
        sr.id,
        sr.signer_name as "signerName",
        sr.signer_email as "signerEmail",
        sr.document_type as "documentType",
        sr.entity_type as "entityType",
        sr.signature_token as "signatureToken",
        e.name as "eventName"
      FROM signature_requests sr
      JOIN events e ON sr.event_id = e.id
      WHERE sr.id = ${params.signatureId}
      LIMIT 1
    `

        if (!signature || signature.length === 0) {
            return NextResponse.json({ error: 'Signature request not found' }, { status: 404 })
        }

        const sig = signature[0]

        // Send email
        const documentTypeName =
            sig.documentType === 'TERMS' ? 'Terms & Conditions' :
                sig.documentType === 'DISCLAIMER' ? 'Liability Disclaimer' :
                    'Contract Agreement'

        const emailSubject = `Signature Required: ${documentTypeName} - ${sig.eventName}`
        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .button:hover { background: #4338ca; }
          .info-box { background: white; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📝 Signature Required</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${sig.signerName}</strong>,</p>
            
            <p>You have been requested to review and sign the following document for <strong>${sig.eventName}</strong>:</p>
            
            <div class="info-box">
              <strong>Document:</strong> ${documentTypeName}<br>
              <strong>Type:</strong> ${sig.entityType}<br>
              <strong>Event:</strong> ${sig.eventName}
            </div>
            
            <p>Please click the button below to review and sign the document:</p>
            
            <div style="text-align: center;">
              <a href="${link}" class="button">Review & Sign Document</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Note:</strong> This signature link will expire in 7 days. Please complete the signing process before the expiration date.
            </p>
            
            <p style="margin-top: 30px;">
              If you have any questions or concerns, please contact the event organizer.
            </p>
            
            <p>Best regards,<br>
            <strong>${sig.eventName} Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>If you're having trouble with the button above, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4f46e5;">${link}</p>
          </div>
        </div>
      </body>
      </html>
    `

        const emailText = `
Signature Required: ${documentTypeName}

Hello ${sig.signerName},

You have been requested to review and sign the following document for ${sig.eventName}:

Document: ${documentTypeName}
Type: ${sig.entityType}
Event: ${sig.eventName}

Please visit the following link to review and sign the document:
${link}

Note: This signature link will expire in 7 days.

If you have any questions, please contact the event organizer.

Best regards,
${sig.eventName} Team
    `

        await sendEmail({
            to: sig.signerEmail,
            subject: emailSubject,
            text: emailText,
            html: emailHtml
        })

        // Log the email send in audit log
        try {
            await prisma.$executeRaw`
        INSERT INTO signature_audit_log (signature_request_id, action, actor_email, details, created_at)
        VALUES (
          ${params.signatureId},
          'EMAIL_SENT',
          ${(session.user as any)?.email || 'system'},
          ${'Signature link sent via email'},
          CURRENT_TIMESTAMP
        )
      `
        } catch (auditError) {
            console.warn('Failed to log email send:', auditError)
        }

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully'
        })

    } catch (error: any) {
        console.error('Error sending signature email:', error)
        return NextResponse.json({
            error: 'Failed to send email',
            details: error.message
        }, { status: 500 })
    }
}
