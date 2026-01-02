
import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

const bigIntReplacer = (key: string, value: any) =>
  typeof value === 'bigint' ? value.toString() : value

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const eventId = BigInt(params.id);
    console.log(`[SESSIONS API] Fetching sessions for EventID: ${params.id}`);

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

    console.log(`[SESSIONS API] Found ${sessions?.length || 0} sessions for event ${params.id}`);
    if (sessions.length > 0) {
      console.log(`[SESSIONS API] Session IDs:`, sessions.map(s => s.id.toString()));
      console.log(`[SESSIONS API] Session Titles:`, sessions.map(s => s.title));
    }

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

    console.log(`[SESSIONS API] Returning ${serialized.length} serialized sessions`);
    console.log(`[SESSIONS API] Response payload:`, JSON.stringify({ sessions: serialized }, null, 2));

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
    const eventId = BigInt(params.id);

    // 1. Fetch Event with dates and daysConfig
    const events = await prisma.$queryRaw`
        SELECT tenant_id as "tenantId", starts_at as "startsAt", ends_at as "endsAt", name, days_config as "daysConfig"
        FROM events 
        WHERE id = ${eventId} LIMIT 1
    ` as any[]

    if (!events.length) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    const event = events[0];

    // 2. Parse session dates
    let sessionStart = new Date(body.startTime);
    let sessionEnd = new Date(body.endTime);

    if (isNaN(sessionStart.getTime())) sessionStart = new Date();
    if (isNaN(sessionEnd.getTime())) sessionEnd = new Date(sessionStart.getTime() + 3600000);

    // Validation 1: End before start
    if (sessionEnd < sessionStart) {
      return NextResponse.json({ error: 'End time cannot be before start time' }, { status: 400 });
    }

    // Validation 2: Check against day-specific times (multi-day) or event times (single-day)
    const daysConfig = event.daysConfig as any[] | null;

    if (daysConfig && daysConfig.length > 1) {
      // Multi-day event: validate against specific day's time range
      const sessionDate = sessionStart.toISOString().split('T')[0];
      const dayConfig = daysConfig.find((d: any) => d.date.split('T')[0] === sessionDate);

      if (!dayConfig) {
        // Show available days
        const availableDays = daysConfig.map((d: any) =>
          `${d.title} (${new Date(d.date).toLocaleDateString()}): ${d.startTime} - ${d.endTime}`
        ).join(', ');

        return NextResponse.json({
          error: `Session date ${sessionDate} is not within event dates. Available days: ${availableDays}`
        }, { status: 400 });
      }

      // Combine date + time for validation
      const dayStart = new Date(`${sessionDate}T${dayConfig.startTime}:00`);
      const dayEnd = new Date(`${sessionDate}T${dayConfig.endTime}:00`);

      if (sessionStart < dayStart || sessionEnd > dayEnd) {
        return NextResponse.json({
          error: `Session must be between ${dayConfig.title}: ${dayConfig.startTime} - ${dayConfig.endTime}`
        }, { status: 400 });
      }
    } else {
      // Single-day event or no daysConfig: use event start/end
      if (event.startsAt && event.endsAt) {
        const eventStart = new Date(event.startsAt);
        const eventEnd = new Date(event.endsAt);

        if (sessionStart < eventStart || sessionEnd > eventEnd) {
          return NextResponse.json({
            error: `Session must be between ${eventStart.toLocaleString()} and ${eventEnd.toLocaleString()}`
          }, { status: 400 });
        }
      }
    }

    // Validation 3: No time conflicts
    const overlapping = await prisma.$queryRaw`
      SELECT id, title, start_time, end_time
      FROM sessions
      WHERE event_id = ${eventId}
        AND (
          (${sessionStart} >= start_time AND ${sessionStart} < end_time)
          OR (${sessionEnd} > start_time AND ${sessionEnd} <= end_time)
          OR (${sessionStart} <= start_time AND ${sessionEnd} >= end_time)
        )
      LIMIT 1
    ` as any[]

    if (overlapping.length > 0) {
      return NextResponse.json({
        error: `Time conflicts with "${overlapping[0].title}"`
      }, { status: 400 });
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
