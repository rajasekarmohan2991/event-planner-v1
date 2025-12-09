import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const { registrationIds, notes } = await req.json()
    
    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ message: 'Registration IDs array required' }, { status: 400 })
    }
    
    console.log(`✅ Bulk approving ${registrationIds.length} registrations for event ${eventId}`)

    const results = []
    const errors = []

    for (const registrationId of registrationIds) {
      try {
        // Get current registration data
        const registrationData = await prisma.$queryRaw`
          SELECT 
            id::text as id,
            data_json,
            email,
            created_at as "createdAt"
          FROM registrations 
          WHERE id = ${registrationId} AND event_id = ${eventId}
          LIMIT 1
        ` as any[]

        if (registrationData.length === 0) {
          errors.push({ registrationId, error: 'Registration not found' })
          continue
        }

        const registration = registrationData[0]
        const currentData = registration.data_json || {}

        // Skip if already approved
        if (currentData.status === 'APPROVED') {
          results.push({ registrationId, status: 'already_approved', approvedAt: currentData.approvedAt })
          continue
        }

        // Update registration with approval
        const updatedData = {
          ...currentData,
          status: 'APPROVED',
          approvedAt: new Date().toISOString(),
          approvedBy: (session as any)?.user?.id || null,
          approvalNotes: notes || null,
          bulkApproved: true
        }

        await prisma.$executeRaw`
          UPDATE registrations 
          SET data_json = ${JSON.stringify(updatedData)}, updated_at = NOW()
          WHERE id = ${registrationId} AND event_id = ${eventId}
        `

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

        // Send approval email (async, don't wait)
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
                        <strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">APPROVED</span>
                      </div>
                      
                      <div class="qr-code">
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
                    
                    <p>We're excited to see you at the event!</p>
                  </div>
                </div>
              </body>
              </html>
            `,
            text: `Registration Approved!\n\nHi ${currentData.firstName},\n\nYour registration has been approved! Status: APPROVED\n\n${notes ? `Notes: ${notes}\n\n` : ''}View your ticket: ${checkInUrl}`
          }).catch(err => console.error(`Bulk approval email failed for ${registrationId}:`, err))
        }

        results.push({ 
          registrationId, 
          status: 'approved', 
          approvedAt: updatedData.approvedAt,
          qrCode,
          checkInUrl 
        })

      } catch (error: any) {
        console.error(`Error approving registration ${registrationId}:`, error)
        errors.push({ registrationId, error: error.message })
      }
    }

    console.log(`✅ Bulk approval completed: ${results.length} approved, ${errors.length} errors`)

    return NextResponse.json({
      success: true,
      message: `Bulk approval completed: ${results.length} approved, ${errors.length} errors`,
      results,
      errors,
      summary: {
        total: registrationIds.length,
        approved: results.filter(r => r.status === 'approved').length,
        alreadyApproved: results.filter(r => r.status === 'already_approved').length,
        failed: errors.length
      }
    })

  } catch (error: any) {
    console.error('❌ Bulk approval error:', error)
    return NextResponse.json({ 
      message: error?.message || 'Bulk approval failed',
      error: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
