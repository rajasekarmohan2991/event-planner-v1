import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const exhibitor = await prisma.exhibitor.findUnique({
      where: { id: params.exhibitorId }
    })

    if (!exhibitor) {
      return NextResponse.json({ message: 'Exhibitor not found' }, { status: 404 })
    }

    // Auto-assign booth number
    // Find the highest booth number for this event and increment
    const existingBooths = await prisma.exhibitor.findMany({
      where: {
        eventId: params.id,
        boothNumber: { not: null }
      },
      select: { boothNumber: true },
      orderBy: { boothNumber: 'desc' }
    })

    let nextBoothNumber = '1'
    if (existingBooths.length > 0 && existingBooths[0].boothNumber) {
      const highestNumber = parseInt(existingBooths[0].boothNumber) || 0
      nextBoothNumber = String(highestNumber + 1)
    }

    // Update exhibitor status to APPROVED and assign booth
    const updated = await prisma.exhibitor.update({
      where: { id: params.exhibitorId },
      data: {
        status: 'APPROVED',
        boothNumber: nextBoothNumber,
        approvedAt: new Date()
      }
    })

    // Fetch event details
    const event = await prisma.event.findUnique({
      where: { id: BigInt(params.id) },
      select: { name: true }
    })

    // Send approval email to exhibitor
    if (exhibitor.contactEmail) {
      await sendEmail({
        to: exhibitor.contactEmail,
        subject: `Booth Approved - ${event?.name || 'Event'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">✅ Your Booth Application Approved!</h2>
            <p>Hi <strong>${exhibitor.contactName || exhibitor.name}</strong>,</p>
            
            <p>Great news! Your booth application for <strong>${event?.name}</strong> has been approved.</p>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Booth Details</h3>
              <p><strong>Booth Number:</strong> #${nextBoothNumber}</p>
              <p><strong>Company:</strong> ${exhibitor.company || exhibitor.name}</p>
            </div>
            
            <div style="background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Next Steps:</strong></p>
              <p style="margin: 5px 0 0 0;">Our team will contact you shortly with pricing details and payment information.</p>
            </div>
            
            <p>Thank you for participating in ${event?.name}!</p>
          </div>
        `,
        text: `Your booth application has been approved! Booth Number: ${nextBoothNumber}`
      }).catch(err => console.error('Failed to send approval email:', err))
    }

    console.log(`✅ Exhibitor approved: ${exhibitor.id}, Booth: ${nextBoothNumber}`)

    return NextResponse.json({
      message: 'Exhibitor approved successfully',
      exhibitor: {
        id: updated.id,
        status: updated.status,
        boothNumber: updated.boothNumber,
        approvedAt: updated.approvedAt
      }
    })

  } catch (error: any) {
    console.error('Approval error:', error)
    return NextResponse.json({
      message: 'Failed to approve exhibitor',
      error: error.message
    }, { status: 500 })
  }
}
