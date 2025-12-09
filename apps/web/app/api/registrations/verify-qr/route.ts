import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    // Decode base64 token
    let payload: any
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8')
      payload = JSON.parse(decoded)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 })
    }

    // Validate token data
    if (!payload.registrationId || !payload.eventId || !payload.email) {
      return NextResponse.json({ error: 'Invalid token data' }, { status: 400 })
    }

    // Check if already checked in
    const kvKey = `evt:${payload.eventId}:reg:${payload.registrationId}`
    const checkinRecord = await prisma.keyValue.findFirst({
      where: { 
        namespace: 'checkin', 
        key: kvKey 
      }
    }).catch(() => null)

    const alreadyCheckedIn = !!checkinRecord

    // Get registration details from database
    const registration = await prisma.$queryRaw<any[]>`
      SELECT 
        id::text,
        event_id::text as "eventId",
        email,
        first_name as "firstName",
        last_name as "lastName",
        phone,
        registration_type as "registrationType",
        status,
        created_at as "createdAt"
      FROM event_attendees
      WHERE id = ${BigInt(payload.registrationId)}
      LIMIT 1
    `

    if (!registration || registration.length === 0) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      attendee: registration[0],
      alreadyCheckedIn,
      checkedInAt: checkinRecord ? (checkinRecord.value as any)?.t : null
    })
  } catch (e: any) {
    console.error('QR verification error:', e)
    return NextResponse.json({ error: e.message || 'Verification failed' }, { status: 500 })
  }
}
