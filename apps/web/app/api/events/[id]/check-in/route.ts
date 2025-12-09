import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { registrationId } = await req.json()
    const eventId = BigInt(params.id)

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID required' }, { status: 400 })
    }

    // Fetch current registration status and data_json
    const reg = await prisma.$queryRaw<any[]>`
      SELECT id, event_id, check_in_status, data_json
      FROM registrations
      WHERE id = ${BigInt(registrationId)} AND event_id = ${eventId}
      LIMIT 1
    `

    if (!reg || reg.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const current = reg[0]
    const dataJson = typeof current.data_json === 'string' ? JSON.parse(current.data_json) : (current.data_json || {})

    // If already checked in, block duplicate
    if (current.check_in_status === 'CHECKED_IN' || dataJson.checkedIn) {
      return NextResponse.json({ success: true, already: true, message: 'Already checked in' })
    }

    // Update both column status and JSON flag; fallback if columns don't exist
    const updatedJson = { 
      ...dataJson, 
      checkedIn: true, 
      checkedInAt: new Date().toISOString(), 
      checkedInBy: (session as any)?.user?.id || null 
    }

    try {
      await prisma.$executeRaw`
        UPDATE registrations
        SET 
          check_in_status = 'CHECKED_IN',
          check_in_time = CURRENT_TIMESTAMP,
          data_json = ${JSON.stringify(updatedJson)}::jsonb,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${BigInt(registrationId)}
          AND event_id = ${eventId}
      `
    } catch (e) {
      // Fallback to updating only data_json if columns are missing
      await prisma.$executeRaw`
        UPDATE registrations
        SET 
          data_json = ${JSON.stringify(updatedJson)}::jsonb,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${BigInt(registrationId)}
          AND event_id = ${eventId}
      `
    }

    return NextResponse.json({ success: true, message: 'Checked in successfully' })
  } catch (error: any) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 })
  }
}
