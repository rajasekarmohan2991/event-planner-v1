import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const params = 'then' in context.params ? await context.params : context.params

  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = BigInt(params.id)

    // Get pending registrations from both tables (registration_approvals and registrations with PENDING status)
    const approvals = await prisma.$queryRaw<any[]>`
      SELECT 
        r.id as "registrationId",
        r.id as id,
        COALESCE(
          CONCAT(
            COALESCE((r.data_json::jsonb)->>'firstName', ''),
            ' ',
            COALESCE((r.data_json::jsonb)->>'lastName', '')
          ),
          r.email
        ) as "attendeeName",
        r.email,
        COALESCE((r.data_json::jsonb)->>'phone', '') as phone,
        r.type as "ticketType",
        COALESCE(((r.data_json::jsonb)->>'finalAmount')::numeric, 0) as "ticketPrice",
        r.created_at as "requestedAt",
        COALESCE(r.status, 'PENDING') as status,
        COALESCE((r.data_json::jsonb)->>'notes', '') as notes,
        t.name as "ticketName"
      FROM registrations r
      LEFT JOIN tickets t ON r.ticket_id::bigint = t.id
      WHERE r.event_id::bigint = ${eventId}
        AND r.status = 'PENDING'
      ORDER BY r.created_at DESC
      LIMIT 100
    `

    console.log('📋 Registration approvals fetched:', { eventId: params.id, count: approvals.length })

    return NextResponse.json({ approvals, total: approvals.length })
  } catch (e: any) {
    console.error('❌ Failed to load approvals:', e)
    return NextResponse.json({ message: e?.message || 'Failed to load approvals', approvals: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const params = 'then' in context.params ? await context.params : context.params

  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { registrationIds, action, notes } = await req.json()
    const eventId = params.id

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ message: 'No registrations selected' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'
    const reviewedBy = (session as any).user?.id || (session as any).user?.email
    const reviewedAt = new Date().toISOString()
    
    let updatedCount = 0
    for (const regId of registrationIds) {
      try {
        // Update registration status
        await prisma.$executeRaw`
          UPDATE registrations 
          SET status = ${newStatus}, 
              updated_at = NOW()
          WHERE id = ${regId} AND event_id = ${eventId}
        `

        // Update registration_approvals table
        await prisma.$executeRaw`
          UPDATE registration_approvals 
          SET status = ${newStatus},
              reviewed_by = ${reviewedBy ? BigInt(reviewedBy) : null},
              reviewed_at = NOW(),
              review_notes = ${notes || null}
          WHERE registration_id = ${regId}
        `

        updatedCount++
        console.log(`✅ Registration ${regId} ${action}d`)
      } catch (err: any) {
        console.error(`Failed to update registration ${regId}:`, err.message)
      }
    }

    if (updatedCount === 0) {
      return NextResponse.json({ 
        message: 'No registrations were updated.',
        success: false 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      message: `${updatedCount} registration(s) ${action}d successfully`,
      success: true,
      updatedCount
    })
  } catch (error: any) {
    console.error('Error processing approvals:', error)
    return NextResponse.json({ 
      message: 'Failed to process approvals',
      error: error.message 
    }, { status: 500 })
  }
}
