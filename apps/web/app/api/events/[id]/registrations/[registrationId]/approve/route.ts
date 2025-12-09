import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string, registrationId: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const registrationId = params.registrationId
    const { notes } = await req.json().catch(() => ({}))
    
    console.log(`✅ Approving registration ${registrationId} for event ${eventId}`)

    // Get current registration data - handle both string and numeric IDs
    let registrationData: any[] = []
    try {
      // Try as string ID first (cuid)
      registrationData = await prisma.$queryRaw`
        SELECT 
          id::text as id,
          data_json,
          email,
          created_at as "createdAt"
        FROM registrations 
        WHERE id::text = ${registrationId} AND event_id = ${eventId}
        LIMIT 1
      ` as any[]
    } catch (e) {
      // If that fails, try as numeric ID
      try {
        const numericId = BigInt(registrationId)
        registrationData = await prisma.$queryRaw`
          SELECT 
            id::text as id,
            data_json,
            email,
            created_at as "createdAt"
          FROM registrations 
          WHERE id = ${numericId} AND event_id = ${eventId}
          LIMIT 1
        ` as any[]
      } catch (e2) {
        console.error('Failed to query registration:', e, e2)
      }
    }

    if (registrationData.length === 0) {
      return NextResponse.json({ message: 'Registration not found' }, { status: 404 })
    }

    const registration = registrationData[0]
    let currentData: any = {}
    try {
      currentData = registration.data_json ? (typeof registration.data_json === 'string' ? JSON.parse(registration.data_json) : registration.data_json) : {}
    } catch (e) {
      console.error('Failed to parse data_json:', e)
    }

    // Check if already approved
    if (currentData.status === 'APPROVED') {
      return NextResponse.json({ 
        message: 'Registration already approved',
        approvedAt: currentData.approvedAt 
      })
    }

    // Update registration with approval
    const updatedData = {
      ...currentData,
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedBy: (session as any)?.user?.id || null,
      approvalNotes: notes || null
    }

    // Update registration - handle both ID types
    try {
      await prisma.$executeRaw`
        UPDATE registrations 
        SET data_json = ${JSON.stringify(updatedData)}::jsonb, updated_at = NOW()
        WHERE id::text = ${registrationId} AND event_id = ${eventId}
      `
    } catch (e) {
      // Try numeric ID
      const numericId = BigInt(registrationId)
      await prisma.$executeRaw`
        UPDATE registrations 
        SET data_json = ${JSON.stringify(updatedData)}::jsonb, updated_at = NOW()
        WHERE id = ${numericId} AND event_id = ${eventId}
      `
    }

    // Generate QR code for approved registration
    const qrData = {
      registrationId: registrationId,
      eventId: eventId,
      email: currentData.email,
      name: `${currentData.firstName} ${currentData.lastName}`.trim(),
      type: currentData.type || 'VIRTUAL',
      timestamp: new Date().toISOString(),
      approved: true
    }

    const qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64')
    const checkInUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/events/${eventId}/checkin?token=${qrCode}`

    // Send approval email
    if (currentData.email) {
      const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`
      
      sendEmail({
        to: currentData.email,
        subject: '🎉 Registration Approved - Your Event Ticket',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px; }
              .ticket { background: white; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
              .qr-code { margin: 20px 0; }
              .qr-code img { max-width: 200px; height: auto; border: 3px solid #10b981; border-radius: 10px; }
              .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #10b981; }
              .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Registration Approved!</h1>
                <p>Your event ticket is ready</p>
              </div>
              <div class="content">
                <p>Hi <strong>${currentData.firstName}</strong>,</p>
                <p>Great news! Your registration has been <strong>approved</strong>. Your event ticket is now active.</p>
                
                <div class="ticket">
                  <h2>✅ Approved Event Ticket</h2>
                  <div class="info">
                    <strong>Registration ID:</strong> ${registrationId}<br>
                    <strong>Name:</strong> ${currentData.firstName} ${currentData.lastName}<br>
                    <strong>Email:</strong> ${currentData.email}<br>
                    <strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">APPROVED</span><br>
                    <strong>Approved:</strong> ${new Date().toLocaleString()}
                  </div>
                  
                  <div class="qr-code">
                    <p><strong>Your Approved QR Code Ticket:</strong></p>
                    <img src="${qrCodeImageUrl}" alt="Approved QR Code Ticket" />
                    <p style="font-size: 12px; color: #666;">Show this QR code at the event entrance</p>
                  </div>
                  
                  <a href="${checkInUrl}" class="button">View Approved Ticket</a>
                </div>
                
                ${notes ? `
                <div class="info">
                  <strong>📝 Approval Notes:</strong><br>
                  ${notes}
                </div>
                ` : ''}
                
                <div class="info">
                  <strong>📱 Next Steps:</strong> Save this email or take a screenshot of the QR code. You're all set for the event!
                </div>
                
                <p>We're excited to see you at the event!</p>
                
                <div class="footer">
                  <p>EventPlanner © 2025 | All rights reserved</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Registration Approved!

Hi ${currentData.firstName},

Your registration has been approved! Your event ticket is now active.

Registration Details:
- Registration ID: ${registrationId}
- Name: ${currentData.firstName} ${currentData.lastName}
- Status: APPROVED
- Approved: ${new Date().toLocaleString()}

${notes ? `Approval Notes: ${notes}` : ''}

View your approved ticket: ${checkInUrl}

We're excited to see you at the event!

EventPlanner © 2025
        `
      }).catch(err => console.error('Approval email send failed:', err))
    }

    console.log(`✅ Registration ${registrationId} approved successfully`)

    return NextResponse.json({
      success: true,
      message: 'Registration approved successfully',
      registration: {
        id: registrationId,
        status: 'APPROVED',
        approvedAt: updatedData.approvedAt,
        approvedBy: updatedData.approvedBy,
        qrCode,
        checkInUrl
      }
    })

  } catch (error: any) {
    console.error('❌ Registration approval error:', error)
    return NextResponse.json({ 
      message: error?.message || 'Approval failed',
      error: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
