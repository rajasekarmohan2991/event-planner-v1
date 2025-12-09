import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireEventRole } from '@/lib/rbac'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

function b64urlToBuf(input: string) {
  const pad = input.length % 4 === 2 ? '==' : input.length % 4 === 3 ? '=' : ''
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const eventId = params.id
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const { token, location, deviceId, idempotencyKey } = await req.json()
    if (!token || typeof token !== 'string') return NextResponse.json({ message: 'token required' }, { status: 400 })

    // Decode base64 token from registration
    let payload: any
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8')
      payload = JSON.parse(decoded)
    } catch (error) {
      return NextResponse.json({ message: 'invalid token format' }, { status: 400 })
    }

    // Validate token data
    if (!payload.registrationId || !payload.eventId || !payload.email) {
      return NextResponse.json({ message: 'invalid token data' }, { status: 400 })
    }

    if (payload.eventId.toString() !== eventId) {
      return NextResponse.json({ message: 'wrong event' }, { status: 400 })
    }

    // Idempotent check-in: use registration ID as key
    const kvKey = `evt:${eventId}:reg:${payload.registrationId}`
    const idem = idempotencyKey || payload.registrationId

    // If already checked-in with same or earlier record, return 200 idempotent
    const existing = await prisma.keyValue.findFirst({
      where: { 
        namespace: 'checkin', 
        key: kvKey 
      },
      select: { value: true }
    }).catch(()=>null)

    const checkinRecord = {
      t: new Date().toISOString(),
      by: (session as any)?.user?.id || null,
      loc: location || null,
      dev: deviceId || null,
      idem,
      payload,
    }

    if (existing && (existing.value as any)?.idem === idem) {
      return NextResponse.json({ ok: true, already: true, record: existing.value })
    }

    // Try to create or update the check-in record (idempotent KV)
    let saved
    try {
      saved = await prisma.keyValue.upsert({
        where: { 
          namespace_key: { 
            namespace: 'checkin', 
            key: kvKey 
          } 
        },
        create: { 
          namespace: 'checkin', 
          key: kvKey, 
          value: checkinRecord 
        },
        update: { 
          value: checkinRecord 
        },
        select: { value: true }
      })
    } catch (upsertError) {
      // If upsert fails, try a simple create
      try {
        saved = await prisma.keyValue.create({
          data: {
            namespace: 'checkin',
            key: kvKey,
            value: checkinRecord
          },
          select: { value: true }
        })
      } catch (createError) {
        console.error('Check-in database error:', createError)
        return NextResponse.json({ message: 'Database error during check-in' }, { status: 500 })
      }
    }

    // Additionally mark the registration as checked-in in primary table
    try {
      const regId = BigInt(payload.registrationId)
      const evtIdNum = parseInt(eventId)
      // Fetch current data_json to merge
      const rows = await prisma.$queryRaw<any[]>`
        SELECT data_json FROM registrations WHERE id = ${regId} AND event_id = ${evtIdNum} LIMIT 1
      `
      const cur = rows[0]?.data_json || {}
      const updated = {
        ...(typeof cur === 'string' ? JSON.parse(cur) : cur),
        checkedIn: true,
        checkedInAt: new Date().toISOString(),
        checkedInBy: (session as any)?.user?.id || null,
      }
      try {
        await prisma.$executeRaw`
          UPDATE registrations
          SET 
            data_json = ${JSON.stringify(updated)}::jsonb,
            check_in_status = 'CHECKED_IN',
            check_in_time = NOW(),
            updated_at = NOW()
          WHERE id = ${regId} AND event_id = ${evtIdNum}
        `
      } catch (e) {
        // Fallback if schema lacks check_in_status/check_in_time columns
        await prisma.$executeRaw`
          UPDATE registrations
          SET 
            data_json = ${JSON.stringify(updated)}::jsonb,
            updated_at = NOW()
          WHERE id = ${regId} AND event_id = ${evtIdNum}
        `
      }
    } catch (e) {
      // Non-fatal: KV stored, but DB update failed
      console.warn('Registration DB check-in update failed:', e)
    }

    return NextResponse.json({ ok: true, record: saved.value })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'check-in failed' }, { status: 500 })
  }
}
