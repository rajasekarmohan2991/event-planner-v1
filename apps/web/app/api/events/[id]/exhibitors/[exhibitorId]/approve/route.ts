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
    const finalAmount = body.finalAmount || undefined

    // Load exhibitor with booths
    const exhibitor = await prisma.exhibitor.findUnique({
      where: { id: params.exhibitorId },
      include: { booths: true }
    })

    if (!exhibitor) {
      return NextResponse.json({ message: 'Exhibitor not found' }, { status: 404 })
    }

    // Basic guard: ensure exhibitor belongs to this event
    if (exhibitor.eventId && params.id && String(exhibitor.eventId) !== String(params.id)) {
      return NextResponse.json({ message: 'Exhibitor does not belong to this event' }, { status: 400 })
    }

    // Find first RESERVED booth
    const reservedBooth = exhibitor.booths.find(b => b.status === 'RESERVED')
    const assignedBooth = exhibitor.booths.find(b => b.status === 'ASSIGNED')

    if (assignedBooth) {
      return NextResponse.json({ message: 'Exhibitor already approved', boothId: assignedBooth.id })
    }

    if (!reservedBooth) {
      return NextResponse.json({ message: 'No reserved booth found for this exhibitor' }, { status: 409 })
    }

    // Approve: set booth to ASSIGNED
    const updatedBooth = await prisma.booth.update({
      where: { id: reservedBooth.id },
      data: { status: 'ASSIGNED', ...(typeof finalAmount === 'number' ? { priceInr: Math.round(finalAmount) } : {}) }
    })

    const to = exhibitor.contactEmail || ''
    if (to) {
      const subject = 'Exhibitor Approval - Booth Assigned'
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color:#16a34a;">Your Exhibitor Registration is Approved</h2>
          <p>Dear ${exhibitor.contactName || exhibitor.name || 'Exhibitor'},</p>
          <p>Your registration has been approved and a booth has been assigned.</p>
          <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;margin:16px 0;">
            <p style="margin:0;"><strong>Booth Number:</strong> ${updatedBooth.boothNumber || 'TBD'}</p>
            <p style="margin:0;"><strong>Status:</strong> ${updatedBooth.status}</p>
            <p style="margin:0;"><strong>Price (INR):</strong> ${updatedBooth.priceInr ?? 0}</p>
          </div>
          <p>Our team will contact you with further instructions.</p>
          <p style="color:#64748b;font-size:12px;">This is an automated message from Event Planner.</p>
        </div>
      `
      await sendEmail({ to, subject, html })
    }

    return NextResponse.json({ 
      message: 'Exhibitor approved and booth assigned',
      booth: { id: updatedBooth.id, status: updatedBooth.status, priceInr: updatedBooth.priceInr }
    })
  } catch (e: any) {
    console.error('Approval error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
