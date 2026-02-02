import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function ensureCancellationRequestsTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS cancellation_requests (
        id BIGSERIAL PRIMARY KEY,
        registration_id BIGINT NOT NULL,
        event_id BIGINT NOT NULL,
        reason TEXT,
        refund_amount NUMERIC(10,2),
        original_amount NUMERIC(10,2),
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        admin_notes TEXT,
        processed_by BIGINT,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        tenant_id VARCHAR(255)
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_cancel_req_event ON cancellation_requests(event_id)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_cancel_req_reg ON cancellation_requests(registration_id)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_cancel_req_status ON cancellation_requests(status)`)
  } catch {}
}

// GET /api/events/[id]/approvals/cancellations - Get pending cancellation requests
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)

    await ensureCancellationRequestsTable()

    // Get pending cancellation requests
    const pendingCancellations = await prisma.$queryRaw`
      SELECT 
        cr.id::text as id,
        cr.registration_id::text as "registrationId",
        cr.event_id as "eventId",
        cr.reason,
        cr.refund_amount as "refundAmount",
        cr.original_amount as "originalAmount",
        cr.status,
        cr.admin_notes as "adminNotes",
        cr.created_at as "requestedAt",
        r.email,
        r.data_json as "dataJson",
        r.type as "ticketType"
      FROM cancellation_requests cr
      JOIN registrations r ON cr.registration_id = r.id
      WHERE cr.event_id = ${eventId}
        AND cr.status = 'PENDING'
      ORDER BY cr.created_at DESC
      LIMIT 50
    ` as any[]

    // Format response
    const formatted = pendingCancellations.map(cancel => {
      const data = typeof cancel.dataJson === 'string' 
        ? JSON.parse(cancel.dataJson) 
        : cancel.dataJson || {}
      
      return {
        id: cancel.id,
        registrationId: cancel.registrationId,
        email: cancel.email || data.email,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        ticketType: cancel.ticketType,
        originalPayment: Number(cancel.originalAmount || 0).toFixed(2),
        refundAmount: Number(cancel.refundAmount || 0).toFixed(2),
        cancellationReason: cancel.reason || '',
        adminNotes: cancel.adminNotes || '',
        requestedAt: cancel.requestedAt,
        status: cancel.status
      }
    })

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('Cancellation approvals fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cancellation requests' },
      { status: 500 }
    )
  }
}

// POST /api/events/[id]/approvals/cancellations - Approve or deny cancellation
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const body = await req.json()
    const { cancellationId, action, adminNotes } = body

    if (!cancellationId || !action) {
      return NextResponse.json(
        { error: 'Missing cancellationId or action' },
        { status: 400 }
      )
    }

    const userId = BigInt(session.user.id)
    const cancelId = BigInt(cancellationId)
    const status = action === 'approve' ? 'APPROVED' : 'DENIED'

    await ensureCancellationRequestsTable()

    // Update cancellation request
    await prisma.$executeRaw`
      UPDATE cancellation_requests
      SET 
        status = ${status},
        processed_by = ${userId},
        processed_at = NOW(),
        admin_notes = ${adminNotes || null}
      WHERE id = ${cancelId}
        AND event_id = ${eventId}
    `

    // If approved, update registration status to CANCELLED
    if (action === 'approve') {
      const cancelRequest = await prisma.$queryRaw`
        SELECT registration_id FROM cancellation_requests WHERE id = ${cancelId}
      ` as any[]
      
      if (cancelRequest.length > 0) {
        const regId = cancelRequest[0].registration_id
        await prisma.$executeRaw`
          UPDATE registrations
          SET data_json = jsonb_set(
            COALESCE(data_json, '{}'::jsonb),
            '{status}',
            to_jsonb('CANCELLED'::text)
          )
          WHERE id = ${regId}
        `

        // Release reserved seats
        await prisma.$executeRaw`
          UPDATE seat_reservations
          SET status = 'CANCELLED'
          WHERE registration_id = ${regId}
        `
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cancellation ${action === 'approve' ? 'approved' : 'denied'} successfully`
    })
  } catch (error: any) {
    console.error('Cancellation approval action error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process cancellation' },
      { status: 500 }
    )
  }
}
