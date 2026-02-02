import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

async function ensureRegistrationApprovalsTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS registration_approvals (
        id BIGSERIAL PRIMARY KEY,
        registration_id BIGINT NOT NULL,
        event_id BIGINT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        reason TEXT,
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        processed_by BIGINT,
        processed_at TIMESTAMP,
        tenant_id VARCHAR(255)
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_reg_appr_event ON registration_approvals(event_id)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_reg_appr_reg ON registration_approvals(registration_id)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_reg_appr_status ON registration_approvals(status)`)
  } catch {}
}

// GET /api/events/[id]/approvals/registrations - Get pending registration approvals
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)

    await ensureRegistrationApprovalsTable()

    // Prefer explicit approvals table; fallback to JSON status if needed
    let pendingRegistrations: any[] = []
    try {
      pendingRegistrations = await prisma.$queryRaw`
        SELECT 
          r.id::text as id,
          r.event_id as "eventId",
          r.data_json as "dataJson",
          r.type,
          r.email,
          r.created_at as "createdAt",
          ra.status as "approvalStatus",
          ra.admin_notes as notes
        FROM registration_approvals ra
        JOIN registrations r ON r.id = ra.registration_id
        WHERE ra.event_id = ${eventId}
          AND ra.status = 'PENDING'
        ORDER BY ra.created_at DESC
        LIMIT 50
      ` as any[]
    } catch (e) {
      pendingRegistrations = []
    }

    if (!pendingRegistrations || pendingRegistrations.length === 0) {
      try {
        pendingRegistrations = await prisma.$queryRaw`
          SELECT 
            r.id::text as id,
            r.event_id as "eventId",
            r.data_json as "dataJson",
            r.type,
            r.email,
            r.created_at as "createdAt",
            NULL::text as "approvalStatus",
            r.admin_notes as notes
          FROM registrations r
          WHERE r.event_id = ${eventId}
            AND (r.data_json->>'status') IN ('PENDING','NEEDS_APPROVAL')
          ORDER BY r.created_at DESC
          LIMIT 50
        ` as any[]
      } catch {}
    }

    // Parse data_json and format response
    const formatted = pendingRegistrations.map(reg => {
      let data: any = {}
      try {
        data = reg.dataJson ? JSON.parse(reg.dataJson) : {}
      } catch (e) {
        console.error('Failed to parse data_json:', e)
        data = {}
      }
      
      return {
        id: reg.id,
        registrationId: reg.id,
        eventId: reg.eventId,
        attendeeName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || reg.email || 'Unknown',
        email: reg.email || data.email || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        ticketType: reg.type || 'GENERAL',
        ticketPrice: parseFloat(data.priceInr || data.totalPrice || '0'),
        requestedAt: reg.createdAt,
        status: 'PENDING',
        notes: reg.notes || ''
      }
    })

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('Registration approvals fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch approvals' },
      { status: 500 }
    )
  }
}

// POST /api/events/[id]/approvals/registrations - Approve or deny registration
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const body = await req.json()
    const { registrationId, action, reason } = body

    if (!registrationId || !action) {
      return NextResponse.json(
        { error: 'Missing registrationId or action' },
        { status: 400 }
      )
    }

    const userId = session.user.id
    const regId = BigInt(registrationId)
    const status = action === 'approve' ? 'APPROVED' : 'DENIED'

    await ensureRegistrationApprovalsTable()

    // Get registration details for email
    const regDetails = await prisma.$queryRaw<any[]>`
      SELECT 
        r.id::text as id,
        r.email,
        r.data_json,
        e.title as "eventTitle"
      FROM registrations r
      JOIN events e ON e.id = r.event_id
      WHERE r.id = ${regId} AND r.event_id = ${eventId}
      LIMIT 1
    `

    if (regDetails.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const reg = regDetails[0]
    const dataJson = typeof reg.data_json === 'string' ? JSON.parse(reg.data_json) : reg.data_json || {}
    const userEmail = reg.email || dataJson.email
    const firstName = dataJson.firstName || 'Guest'
    const lastName = dataJson.lastName || ''

    // Update approvals table and registration JSON status
    const newReviewStatus = action === 'approve' ? 'APPROVED' : 'DENIED'
    try {
      await prisma.$executeRaw`
        UPDATE registration_approvals
        SET status = ${newReviewStatus}, processed_by = ${BigInt(userId)}, processed_at = NOW(), admin_notes = ${reason || null}
        WHERE registration_id = ${regId} AND event_id = ${eventId}
      `
    } catch {}
    // Update registration JSON flags (and admin_notes if column exists)
    await prisma.$executeRawUnsafe(
      `UPDATE registrations
       SET data_json = COALESCE(data_json,'{}'::jsonb) || jsonb_build_object('status', $1, $2, $3, $4),
           updated_at = NOW()
       WHERE id = $5 AND event_id = $6`,
       newReviewStatus,
       'approvedAt', action === 'approve' ? new Date().toISOString() : null,
       'approvedBy', String(userId),
       regId,
       eventId
    )

    // Send email notifications
    if (userEmail) {
      if (action === 'approve') {
        // Generate QR code for approved registration
        const qrData = {
          registrationId: registrationId,
          eventId: eventId,
          email: userEmail,
          name: `${firstName} ${lastName}`.trim(),
          type: dataJson.type || 'GENERAL',
          timestamp: new Date().toISOString(),
          approved: true
        }

        const qrCode = Buffer.from(JSON.stringify(qrData)).toString('base64')
        const checkInUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/events/${eventId}/checkin?token=${qrCode}`
        const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`

        await sendEmail({
          to: userEmail,
          subject: `🎉 Registration Approved - ${reg.eventTitle || 'Your Event'}`,
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
                  <p>Hi <strong>${firstName}</strong>,</p>
                  <p>Great news! Your registration for <strong>${reg.eventTitle}</strong> has been approved.</p>
                  
                  <div class="ticket">
                    <h2>✅ Approved Event Ticket</h2>
                    <div class="info">
                      <strong>Registration ID:</strong> ${registrationId}<br>
                      <strong>Name:</strong> ${firstName} ${lastName}<br>
                      <strong>Email:</strong> ${userEmail}<br>
                      <strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">APPROVED</span>
                    </div>
                    
                    <div class="qr-code">
                      <p><strong>Your QR Code Ticket:</strong></p>
                      <img src="${qrCodeImageUrl}" alt="QR Code Ticket" />
                      <p style="font-size: 12px; color: #666;">Show this QR code at the event entrance</p>
                    </div>
                    
                    <a href="${checkInUrl}" class="button">View Ticket</a>
                  </div>
                  
                  <p>We're excited to see you at the event!</p>
                </div>
              </div>
            </body>
            </html>
          `
        }).catch(err => console.error('Failed to send approval email:', err))
      } else {
        // Send denial email
        await sendEmail({
          to: userEmail,
          subject: `❌ Registration Denied - ${reg.eventTitle || 'Your Event'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ef4444;">❌ Registration Denied</h2>
              <p>Hi ${firstName},</p>
              <p>We regret to inform you that your registration for <strong>${reg.eventTitle}</strong> has been denied.</p>
              
              <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Status:</strong> Denied</p>
              </div>
              
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              
              <p>If you believe this is an error, please contact our support team.</p>
            </div>
          `
        }).catch(err => console.error('Failed to send denial email:', err))
      }
    }

    return NextResponse.json({
      success: true,
      message: `Registration ${action === 'approve' ? 'approved' : 'denied'} successfully`
    })
  } catch (error: any) {
    console.error('Registration approval action error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process approval' },
      { status: 500 }
    )
  }
}
