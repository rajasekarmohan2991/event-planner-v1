import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  // Permission: allow users who can manage event registrations
  const permError = await checkPermissionInRoute('events.manage_registrations', 'Approve Exhibitor')
  if (permError) return permError

  try {
    const body = await req.json().catch(() => ({}))
    const userId = (session as any)?.user?.id

    // Load exhibitor with booths
    const exhibitor = await prisma.exhibitor.findUnique({
      where: { id: params.exhibitorId },
      include: { booths: true }
    })

    if (!exhibitor) {
      return NextResponse.json({ message: 'Exhibitor not found' }, { status: 404 })
    }

    // Ensure exhibitor belongs to this event
    if (exhibitor.eventId && params.id && String(exhibitor.eventId) !== String(params.id)) {
      return NextResponse.json({ message: 'Exhibitor does not belong to this event' }, { status: 400 })
    }

    // Check if email is confirmed
    if (!exhibitor.emailConfirmed) {
      return NextResponse.json({ message: 'Exhibitor email must be confirmed first' }, { status: 400 })
    }

    // Check if already approved
    if (exhibitor.adminApproved) {
      return NextResponse.json({ message: 'Exhibitor already approved' })
    }

    // Update exhibitor with approval
    const updated = await prisma.exhibitor.update({
      where: { id: params.exhibitorId },
      data: {
        adminApproved: true,
        approvedBy: userId,
        approvedAt: new Date(),
        status: 'PAYMENT_PENDING'
      }
    })

    // Update booth status
    const reservedBooth = exhibitor.booths.find(b => b.status === 'RESERVED')
    if (reservedBooth) {
      await prisma.booth.update({
        where: { id: reservedBooth.id },
        data: { status: 'ASSIGNED' }
      })
    }

    // Fetch event details
    const event = await prisma.event.findUnique({
      where: { id: BigInt(params.id) },
      select: { name: true }
    })
    const eventName = event?.name || `Event #${params.id}`

    // Send approval email with payment instructions
    const to = exhibitor.contactEmail || ''
    if (to) {
      sendEmail({
        to,
        subject: `Exhibitor Registration Approved - ${eventName}`,
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
              .payment-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Registration Approved!</h1>
                <p>Exhibitor Registration for ${eventName}</p>
              </div>
              <div class="content">
                <p>Hi <strong>${exhibitor.contactName}</strong>,</p>
                
                <div class="success">
                  <strong>✓ Your exhibitor registration has been approved!</strong>
                </div>
                
                <div class="info">
                  <strong>Company:</strong> ${exhibitor.name}<br>
                  <strong>Booth Size:</strong> ${exhibitor.boothOption}<br>
                  <strong>Status:</strong> Payment Pending
                </div>
                
                <div class="payment-box">
                  <h3 style="margin-top: 0;">💳 Payment Required</h3>
                  <p><strong>Amount Due:</strong> ₹${(exhibitor.paymentAmount || 0).toLocaleString()}</p>
                  <p>Please complete your payment to confirm your booth allocation.</p>
                  <p><strong>Payment Methods:</strong></p>
                  <ul>
                    <li>Bank Transfer</li>
                    <li>Credit/Debit Card</li>
                    <li>UPI</li>
                  </ul>
                  <p style="font-size: 12px; color: #666;">
                    Payment instructions will be sent separately or contact the event organizer.
                  </p>
                </div>
                
                <div class="info">
                  <strong>Next Steps:</strong><br>
                  1. Complete payment<br>
                  2. Booth will be allocated<br>
                  3. Receive QR code for event access
                </div>
                
                <div class="footer">
                  <p>EventPlanner © 2025 | All rights reserved</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      }).catch(err => console.error('Failed to send approval email:', err))
    }

    console.log(`Exhibitor approved: ${exhibitor.id} by user: ${userId}`)

    return NextResponse.json({
      message: 'Exhibitor approved successfully. Payment instructions sent.',
      exhibitor: {
        id: updated.id,
        company: updated.name,
        status: updated.status,
        approvedAt: updated.approvedAt
      }
    })
  } catch (e: any) {
    console.error('Approval error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
