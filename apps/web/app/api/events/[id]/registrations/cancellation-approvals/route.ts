import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id

    // Get pending cancellation requests
    // Fetch raw strings from JSON to avoid SQL cast errors (e.g. invalid syntax for integer)
    const cancellationsRaw = await prisma.$queryRaw<any[]>`
      SELECT 
        r.id::text as "registrationId",
        r.id::text as id,
        r.email,
        r.data_json as "dataJson",
        r.type as "ticketType",
        r.created_at as "createdAt"
      FROM registrations r
      WHERE r.event_id = ${eventId}::bigint
        AND r.data_json IS NOT NULL
        AND (
          (r.data_json::jsonb->>'status') = 'PENDING_CANCELLATION'
          OR COALESCE(r.data_json::jsonb->>'cancelReason','') <> ''
        )
      ORDER BY r.created_at DESC
      LIMIT 100
    `

    console.log('📋 Cancellation approvals raw fetch:', { eventId, count: cancellationsRaw.length })

    // Process and parse in JS
    const cancellations = cancellationsRaw.map(row => {
      let data: any = {}
      try {
        if (typeof row.dataJson === 'string') {
          data = JSON.parse(row.dataJson)
        } else if (row.dataJson && typeof row.dataJson === 'object') {
          data = row.dataJson
        }
      } catch (e) {
        console.error('Failed to parse dataJson for cancellation:', row.id)
      }

      const firstName = data.firstName || ''
      const lastName = data.lastName || ''
      const attendeeName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (row.email || 'N/A')

      const priceVal = data.priceInr || data.finalAmount || 0
      const totalVal = data.totalPrice || data.priceInr || 0

      return {
        registrationId: row.id,
        id: row.id,
        attendeeName,
        email: row.email || data.email || '',
        phone: data.phone || '',
        ticketType: row.ticketType || 'Standard',
        ticketPrice: Number(priceVal) || 0,
        originalPayment: Number(totalVal) || 0,
        cancellationReason: data.cancelReason || '',
        refundRequested: data.refundRequested === true || data.refundRequested === 'true',
        refundAmount: Number(data.refundAmount) || 0,
        requestedAt: data.cancellationRequestedAt || row.createdAt,
        status: 'PENDING'
      }
    })

    return NextResponse.json(cancellations)
  } catch (e: any) {
    console.error('❌ Failed to load cancellation approvals:', e)
    return NextResponse.json({ message: e?.message || 'Failed to load cancellation approvals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { registrationIds, action, notes, refundAmount, refundMode } = await req.json()
    const eventId = params.id

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ message: 'No registrations selected' }, { status: 400 })
    }

    if (!['approve', 'reject', 'request_info'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
    }

    const approvedBy = (session as any).user.email || (session as any).user.id
    let updatedCount = 0

    for (const regId of registrationIds) {
      try {
        // Get registration details for email
        const regDetails = await prisma.$queryRaw<any[]>`
          SELECT 
            r.id::text as id,
            r.email,
            r.data_json,
            COALESCE(e.name, e.title, 'Event') as "eventTitle"
          FROM registrations r
          JOIN events e ON e.id = r.event_id
          WHERE r.id = ${regId} AND r.event_id = ${eventId}::bigint
          LIMIT 1
        `

        if (regDetails.length === 0) continue

        const reg = regDetails[0]
        const dataJson = typeof reg.data_json === 'string' ? JSON.parse(reg.data_json) : reg.data_json || {}
        const userEmail = reg.email || dataJson.email
        const firstName = dataJson.firstName || 'Guest'

        if (action === 'approve') {
          // Approve cancellation (JSON-first, no column dependency)
          await prisma.$executeRaw`
            UPDATE registrations 
            SET 
              data_json = jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(
                      jsonb_set(
                        COALESCE(data_json, '{}'::jsonb),
                        '{status}',
                        to_jsonb('CANCELLED'::text)
                      ),
                      '{ticketInvalidated}',
                      'true'::jsonb
                    ),
                    '{cancelledAt}',
                    to_jsonb(CURRENT_TIMESTAMP::text)
                  ),
                  '{cancelledBy}',
                  to_jsonb(${approvedBy}::text)
                ),
                '{refundAmount}',
                to_jsonb(${refundAmount || 0}::numeric)
              )
            WHERE id = ${regId} AND event_id = ${eventId}::bigint
          `

          // Send approval email
          if (userEmail) {
            await sendEmail({
              to: userEmail,
              subject: `✅ Cancellation Approved - ${reg.eventTitle}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #10b981;">✅ Cancellation Approved</h2>
                  <p>Hi ${firstName},</p>
                  <p>Your cancellation request for <strong>${reg.eventTitle}</strong> has been approved.</p>
                  
                  <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Status:</strong> Cancelled</p>
                    ${refundAmount && refundAmount > 0 ? `<p style="margin: 5px 0 0 0;"><strong>Refund Amount:</strong> ₹${refundAmount}</p>` : ''}
                  </div>
                  
                  ${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ''}
                  
                  ${refundAmount && refundAmount > 0 ? '<p>Your refund will be processed within 5-7 business days.</p>' : ''}
                  <p>Thank you for your understanding.</p>
                </div>
              `
            }).catch(err => console.error('Failed to send cancellation approval email:', err))
          }

        } else if (action === 'reject') {
          // Reject cancellation - revert JSON fields
          await prisma.$executeRaw`
            UPDATE registrations 
            SET 
              data_json = jsonb_set(
                jsonb_set(
                  jsonb_set(
                    COALESCE(data_json, '{}'::jsonb),
                    '{status}',
                    to_jsonb('CONFIRMED'::text)
                  ),
                  '{cancelReason}',
                  '""'::jsonb
                ),
                '{refundRequested}',
                'false'::jsonb
              )
            WHERE id = ${regId} AND event_id = ${eventId}::bigint
          `

          // Send rejection email
          if (userEmail) {
            await sendEmail({
              to: userEmail,
              subject: `❌ Cancellation Request Denied - ${reg.eventTitle}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #ef4444;">❌ Cancellation Request Denied</h2>
                  <p>Hi ${firstName},</p>
                  <p>We regret to inform you that your cancellation request for <strong>${reg.eventTitle}</strong> has been denied.</p>
                  
                  <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Status:</strong> Active (Not Cancelled)</p>
                  </div>
                  
                  ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ''}
                  
                  <p>Your registration remains active. We look forward to seeing you at the event!</p>
                  <p>If you have any questions, please contact our support team.</p>
                </div>
              `
            }).catch(err => console.error('Failed to send cancellation rejection email:', err))
          }

        } else if (action === 'request_info') {
          // Request more information (store in JSON)
          await prisma.$executeRaw`
            UPDATE registrations 
            SET 
              data_json = jsonb_set(
                COALESCE(data_json, '{}'::jsonb),
                '{adminNotes}',
                to_jsonb(${notes || 'More information requested'}::text)
              )
            WHERE id = ${regId} AND event_id = ${eventId}::bigint
          `
        }

        updatedCount++
      } catch (err) {
        console.error(`Failed to update cancellation ${regId}:`, err)
      }
    }

    if (updatedCount === 0) {
      return NextResponse.json({
        message: 'No cancellations were updated.',
        success: false
      }, { status: 404 })
    }

    return NextResponse.json({
      message: `${updatedCount} cancellation(s) processed successfully`,
      success: true,
      updatedCount,
      action
    })
  } catch (error: any) {
    console.error('Error processing cancellation approvals:', error)
    return NextResponse.json({
      message: 'Failed to process cancellation approvals',
      error: error.message
    }, { status: 500 })
  }
}
