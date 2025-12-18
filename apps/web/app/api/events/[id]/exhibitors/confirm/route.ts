import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json({ error: 'Confirmation token required' }, { status: 400 })
        }

        // Find exhibitor by confirmation token
        const exhibitor = await prisma.exhibitor.findUnique({
            where: { confirmationToken: token }
        })

        if (!exhibitor) {
            return NextResponse.json({ error: 'Invalid or expired confirmation token' }, { status: 404 })
        }

        // Check if already confirmed
        if (exhibitor.emailConfirmed) {
            return NextResponse.json({
                message: 'Email already confirmed',
                status: exhibitor.status
            })
        }

        // Update exhibitor status
        const updated = await prisma.exhibitor.update({
            where: { id: exhibitor.id },
            data: {
                emailConfirmed: true,
                confirmedAt: new Date(),
                status: 'AWAITING_APPROVAL',
                confirmationToken: null // Clear token after use
            }
        })

        // Fetch event details
        const event = await prisma.event.findUnique({
            where: { id: BigInt(params.id) },
            select: { name: true }
        })
        const eventName = event?.name || `Event #${params.id}`

        // Send notification to exhibitor
        sendEmail({
            to: exhibitor.contactEmail || '',
            subject: `Email Confirmed - ${eventName}`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2d2d2d; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Email Confirmed!</h1>
              <p>Exhibitor Registration for ${eventName}</p>
            </div>
            <div class="content">
              <p>Hi <strong>${exhibitor.contactName}</strong>,</p>
              
              <div class="success">
                <strong>✓ Your email has been confirmed successfully!</strong>
              </div>
              
              <p>Your exhibitor registration is now pending admin approval.</p>
              
              <div class="info">
                <strong>Next Steps:</strong><br>
                1. Our team will review your registration<br>
                2. You'll receive an email once approved<br>
                3. Payment instructions will be provided<br>
                4. Booth will be allocated after payment
              </div>
              
              <div class="info">
                <strong>Company:</strong> ${exhibitor.name}<br>
                <strong>Contact:</strong> ${exhibitor.contactName}<br>
                <strong>Status:</strong> Awaiting Approval
              </div>
              
              <p>We'll notify you as soon as your registration is reviewed.</p>
              
              <div class="footer">
                <p>EventPlanner © 2025 | All rights reserved</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
        }).catch(err => console.error('Failed to send confirmation email:', err))

        console.log(`Email confirmed for exhibitor: ${exhibitor.id}`)

        return NextResponse.json({
            message: 'Email confirmed successfully! Your registration is now pending admin approval.',
            status: 'AWAITING_APPROVAL',
            exhibitor: {
                id: updated.id,
                company: updated.name,
                status: updated.status
            }
        })
    } catch (error: any) {
        console.error('Confirmation error:', error)
        return NextResponse.json({ error: error.message || 'Confirmation failed' }, { status: 500 })
    }
}
