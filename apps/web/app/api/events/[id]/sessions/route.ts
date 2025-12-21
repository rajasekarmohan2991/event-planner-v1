
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const bigIntReplacer = (key: string, value: any) =>
  typeof value === 'bigint' ? value.toString() : value

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const eventId = BigInt(params.id);

    const sessions = await prisma.$queryRaw`
      SELECT 
        id, 
        title, 
        description, 
        start_time as "startTime", 
        end_time as "endTime", 
        event_id as "eventId", 
        tenant_id as "tenantId"
      FROM sessions
      WHERE event_id = ${eventId}
      ORDER BY start_time ASC
    ` as any[]

    const sessionsWithSpeakers = await Promise.all(sessions.map(async (sess) => {
      const speakers = await prisma.$queryRaw`
            SELECT s.id, s.name, s.title, s.photo_url as "photoUrl"
            FROM speakers s
            JOIN session_speakers ss ON s.id = ss.speaker_id
            WHERE ss.session_id = ${sess.id}
        ` as any[]

      return {
        ...sess,
        speakers: JSON.parse(JSON.stringify(speakers || [], bigIntReplacer))
      }
    }));

    const serialized = JSON.parse(JSON.stringify(sessionsWithSpeakers, bigIntReplacer)).map((s: any) => ({
      ...s,
      id: s.id.toString(),
      eventId: s.eventId.toString()
    }));

    return NextResponse.json({ sessions: serialized });

  } catch (error: any) {
    console.error('GET sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const eventId = BigInt(params.id); // Assuming ID is valid. If NaN, throws error (500).

    // 1. Fetch Event for Tenant
    const events = await prisma.$queryRaw`
        SELECT tenant_id as "tenantId"
        FROM events 
        WHERE id = ${eventId} LIMIT 1
    ` as any[]

    if (!events.length) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    const event = events[0];

    // 2. Dates
    let sessionStart = new Date(body.startTime);
    let sessionEnd = new Date(body.endTime);

    // Safety check for Invalid Date
    if (isNaN(sessionStart.getTime())) sessionStart = new Date();
    if (isNaN(sessionEnd.getTime())) sessionEnd = new Date(sessionStart.getTime() + 3600000);

    // Relaxed Validation: Only block if End is STRICTLY BEFORE Start
    if (sessionEnd < sessionStart) {
      return NextResponse.json({ error: 'End time cannot be before start time' }, { status: 400 });
    }

    // 3. Insert Session
    const newSessionResult = await prisma.$queryRaw`
        INSERT INTO sessions (
            event_id, tenant_id, title, description, start_time, end_time, created_at, updated_at
        ) VALUES (
            ${eventId}, ${event.tenantId}, ${body.title}, ${body.description || null},
            ${sessionStart}, ${sessionEnd}, NOW(), NOW()
        )
        RETURNING id, event_id as "eventId"
    ` as any[]

    const newSession = newSessionResult[0];

    // 4. Link Speakers
    if (body.speakers && Array.isArray(body.speakers)) {
      for (const spId of body.speakers) {
        try {
          await prisma.$executeRawUnsafe(`
                    INSERT INTO session_speakers (session_id, speaker_id) VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, newSession.id, BigInt(spId))
        } catch (e) { console.error('Speaker link error', e) }
      }
    }

    // 5. Calendar
    if (body.addToCalendar) {
      try {
        await prisma.$executeRawUnsafe(`
                INSERT INTO calendar_events (
                    event_id, session_id, title, description, start_time, end_time, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, eventId, newSession.id, body.title, body.description || '', sessionStart, sessionEnd)
      } catch (e) { console.error('Calendar error', e) }
    }

    return NextResponse.json({
      ...newSession,
      id: newSession.id.toString(),
      eventId: newSession.eventId.toString(),
      success: true
    }, { status: 201 });

  } catch (error: any) {
    console.error('POST sessions error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
