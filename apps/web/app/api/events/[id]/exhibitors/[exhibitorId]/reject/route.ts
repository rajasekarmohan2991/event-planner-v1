import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const permError = await checkPermissionInRoute('events.manage_registrations', 'Reject Exhibitor')
  if (permError) return permError

  try {
    const body = await req.json()
    const { reason } = body
    const userId = (session as any)?.user?.id

    if (!reason) {
      return NextResponse.json({ message: 'Rejection reason required' }, { status: 400 })
    }

    const exhibitor = await prisma.exhibitor.findUnique({
      where: { id: params.exhibitorId }
    })

    if (!exhibitor) {
      return NextResponse.json({ message: 'Exhibitor not found' }, { status: 404 })
    }

    // Update exhibitor with rejection
    const updated = await prisma.exhibitor.update({
      where: { id: params.exhibitorId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: userId,
        approvedAt: new Date()
      }
    })

    // Fetch event details
    const event = await prisma.event.findUnique({
      where: { id: BigInt(params.id) },
      select: { name: true }
    })
    const eventName = event?.name || `Event #${params.id}`

    // Send rejection email
    const to = exhibitor.contactEmail || ''
    if (to) {
      sendEmail({
        to,
        subject: `Exhibitor Registration Update - ${eventName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .warning { background: #fee2e2; border: 1px solid #fecaca; color: #991b1b; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #ef4444; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Registration Update</h1>
                <p>Exhibitor Registration for ${eventName}</p>
              </div>
              <div class="content">
                <p>Hi <strong>${exhibitor.contactName}</strong>,</p>
                
                <div class="warning">
                  <strong>We regret to inform you that your exhibitor registration was not approved at this time.</strong>
                </div>
                
                <div class="info">
                  <strong>Reason:</strong><br>
                  ${reason}
                </div>
                
                <p>If you have any questions or would like to discuss this decision, please contact the event organizer.</p>
                
                <p>Thank you for your interest in ${eventName}.</p>
                
                <div class="footer">
                  <p>EventPlanner © 2025 | All rights reserved</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      }).catch(err => console.error('Failed to send rejection email:', err))
    }

    console.log(`Exhibitor rejected: ${exhibitor.id} by user: ${userId}`)

    return NextResponse.json({
      message: 'Exhibitor registration rejected',
      exhibitor: {
        id: updated.id,
        company: updated.name,
        status: updated.status
      }
    })
  } catch (e: any) {
    console.error('Rejection error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
