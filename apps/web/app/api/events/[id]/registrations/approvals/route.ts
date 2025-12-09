import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = BigInt(params.id)

    // Get real pending registration approvals from database
    const approvals = await prisma.$queryRaw<any[]>`
      SELECT 
        r.id::text as "registrationId",
        r.id::text as id,
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
        COALESCE(((r.data_json::jsonb)->>'priceInr')::numeric, 0) as "ticketPrice",
        r.created_at as "requestedAt",
        COALESCE(r.review_status, 'PENDING') as status,
        COALESCE(r.admin_notes, '') as notes
      FROM registrations r
      WHERE r.event_id = ${eventId}
        AND COALESCE(r.review_status, 'PENDING') = 'PENDING'
      ORDER BY r.created_at DESC
      LIMIT 50
    `

    console.log('📋 Registration approvals fetched:', { eventId: params.id, count: approvals.length })

    return NextResponse.json(approvals)
  } catch (e: any) {
    console.error('❌ Failed to load approvals:', e)
    return NextResponse.json({ message: e?.message || 'Failed to load approvals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { registrationIds, action, notes } = await req.json()
    const eventId = BigInt(params.id)

    if (!registrationIds || !Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json({ message: 'No registrations selected' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
    }

    // Update registration status based on action
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED'
    const approvedBy = (session as any).user.email || (session as any).user.id
    
    // Update registrations in database with proper error handling
    let updatedCount = 0
    for (const regId of registrationIds) {
      try {
        const result = await prisma.$executeRawUnsafe(`
          UPDATE registrations 
          SET review_status = $1, 
              updated_at = CURRENT_TIMESTAMP,
              admin_notes = $2,
              data_json = jsonb_set(
                COALESCE(data_json, '{}'::jsonb),
                '{approvedBy}',
                to_jsonb($3::text)
              ),
              data_json = jsonb_set(
                data_json,
                '{approvedAt}',
                to_jsonb(CURRENT_TIMESTAMP::text)
              )
          WHERE id = $4::bigint AND event_id = $5::bigint
        `, status, notes || '', approvedBy, BigInt(regId), eventId)
        updatedCount++
      } catch (err) {
        console.error(`Failed to update registration ${regId}:`, err)
      }
    }

    if (updatedCount === 0) {
      return NextResponse.json({ 
        message: 'No registrations were updated. Please check if they exist.',
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
