import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Make session optional: allow public QR check-in
    const session = await getServerSession(authOptions as any).catch(() => null)

    const eventId = parseInt(params.id)
    const { token, location, deviceId } = await req.json()

    console.log(`🔄 Simple Check-in for event ${eventId}`)

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ message: 'Token required' }, { status: 400 })
    }

    // Decode token from QR (supports JSON, base64, base64url, URL-encoded)
    let payload: any
    const rawToken = String(token).trim()
    const decodeCandidates: Array<() => any> = [
      // Direct JSON
      () => JSON.parse(rawToken),
      // Standard base64
      () => JSON.parse(Buffer.from(rawToken, 'base64').toString('utf8')),
      // URL-decoded then base64
      () => JSON.parse(Buffer.from(decodeURIComponent(rawToken), 'base64').toString('utf8')),
      // Base64url variant
      () => {
        const pad = rawToken.length % 4 === 2 ? '==' : rawToken.length % 4 === 3 ? '=' : ''
        const b64 = rawToken.replace(/-/g, '+').replace(/_/g, '/') + pad
        return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
      },
    ]
    for (const f of decodeCandidates) {
      try { payload = f(); break } catch { }
    }
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token format' }, { status: 400 })
    }

    // Validate token data (email optional for backward compatibility)
    if (!payload.registrationId || !payload.eventId) {
      return NextResponse.json({ message: 'Invalid token data' }, { status: 400 })
    }

    if (payload.eventId.toString() !== eventId.toString()) {
      return NextResponse.json({ message: 'Wrong event' }, { status: 400 })
    }

    // Check if registration exists using raw query to avoid type issues
    const registrationCheck = await prisma.$queryRaw`
      SELECT id FROM registrations 
      WHERE id = ${payload.registrationId}
        AND event_id = ${BigInt(eventId)}
      LIMIT 1
    ` as any[]

    if (registrationCheck.length === 0) {
      return NextResponse.json({ message: 'Registration not found' }, { status: 404 })
    }

    // Check if already checked in by looking at registration data and column status
    const registrationData = await prisma.$queryRaw`
      SELECT 
        id, 
        data_json as "dataJson",
        check_in_status as "checkInStatus",
        created_at as "createdAt"
      FROM registrations 
      WHERE id = ${payload.registrationId}
        AND event_id = ${BigInt(eventId)}
      LIMIT 1
    ` as any[]

    if (registrationData.length === 0) {
      return NextResponse.json({ message: 'Registration not found' }, { status: 404 })
    }

    const regRow = registrationData[0]
    const rawJson = (regRow as any)?.dataJson
    let regData: any = {}
    try {
      regData = typeof rawJson === 'string' ? JSON.parse(rawJson) : (rawJson || {})
    } catch {
      regData = {}
    }

    // Check if already checked in (check both column and JSON data)
    const isAlreadyCheckedIn = (regRow as any)?.checkInStatus === 'CHECKED_IN' || regData?.checkedIn === true

    if (isAlreadyCheckedIn) {
      console.log(`⚠️  Registration ${payload.registrationId} already checked in`)
      return NextResponse.json({
        ok: false,
        already: true,
        message: 'This QR code has already been used. Attendee is already checked in.',
        checkedInAt: regData.checkedInAt || (regRow as any)?.check_in_time
      }, { status: 400 })
    }

    // Update registration with check-in data
    const checkedInAt = new Date().toISOString()
    // Ensure no BigInt leaks into JSON (JSON.stringify fails on BigInt)
    const rawUserId = (session as any)?.user?.id
    const checkedInBySafe = rawUserId == null ? null : String(rawUserId)
    const updatedData = {
      ...regData,
      checkedIn: true,
      checkedInAt: checkedInAt,
      checkedInBy: checkedInBySafe,
      checkedInLocation: location || null,
      checkedInDevice: deviceId || null
    }

    // First ensure the columns exist
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE registrations ADD COLUMN IF NOT EXISTS check_in_status VARCHAR(50) DEFAULT 'PENDING';
        ALTER TABLE registrations ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP;
      `)
    } catch (alterErr) {
      console.log('Columns may already exist or alter failed:', alterErr)
    }

    // Now update with both JSON and column (data_json is TEXT, not JSONB)
    try {
      await prisma.$executeRaw`
        UPDATE registrations 
        SET 
          data_json = ${JSON.stringify(updatedData)},
          check_in_status = 'CHECKED_IN',
          check_in_time = NOW(),
          updated_at = NOW()
        WHERE id = ${payload.registrationId} 
          AND event_id = ${BigInt(eventId)}
      `
      console.log(`✅ Updated registration ${payload.registrationId} to CHECKED_IN`)
    } catch (e) {
      console.error('❌ Primary update failed:', e)
      // Fallback if check_in_status/check_in_time columns do not exist
      try {
        await prisma.$executeRaw`
          UPDATE registrations 
          SET 
            data_json = ${JSON.stringify(updatedData)},
            updated_at = NOW()
          WHERE id = ${payload.registrationId} 
            AND event_id = ${BigInt(eventId)}
        `
        console.log(`✅ Updated registration ${payload.registrationId} (fallback mode)`)
      } catch (fallbackErr) {
        console.error('❌ Fallback update also failed:', fallbackErr)
        throw fallbackErr
      }
    }

    console.log(`✅ Check-in successful for registration ${payload.registrationId}`)

    return NextResponse.json({
      ok: true,
      message: 'Check-in successful',
      checkedInAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Simple check-in error:', error)
    return NextResponse.json({
      message: error?.message || 'Check-in failed',
      error: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
