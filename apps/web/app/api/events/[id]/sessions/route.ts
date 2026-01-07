
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
        tenant_id as "tenantId",
        location,
        stream_url as "streamUrl",
        is_live as "isLive"
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
    console.error('GET sessions error message:', error.message);
    
    // Handle missing table/column errors with self-healing
    if (error.message?.includes('relation') || error.message?.includes('does not exist') || error.message?.includes('column')) {
      try {
        // Try to create sessions table if it doesn't exist
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS sessions (
            id BIGSERIAL PRIMARY KEY,
            event_id BIGINT NOT NULL,
            tenant_id TEXT,
            title TEXT NOT NULL,
            description TEXT,
            start_time TIMESTAMP WITH TIME ZONE,
            end_time TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
        
        // Return empty sessions after repair
        return NextResponse.json({ sessions: [] });
      } catch (repairError) {
        console.error('Sessions table repair failed:', repairError);
      }
    }
    
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const eventId = BigInt(params.id);

    console.log(`[SESSIONS POST] Creating session for event ${params.id}:`, body);

    // 1. Fetch Event with dates and daysConfig
    const events = await prisma.$queryRaw`
        SELECT tenant_id as "tenantId", starts_at as "startsAt", ends_at as "endsAt", name, days_config as "daysConfig"
        FROM events 
        WHERE id = ${eventId} LIMIT 1
    ` as any[]

    if (!events.length) {
      console.error(`[SESSIONS POST] Event ${params.id} not found`);
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    const event = events[0];

    console.log(`[SESSIONS POST] Event config:`, {
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      daysConfig: event.daysConfig
    });

    // 2. Parse session dates
    let sessionStart = new Date(body.startTime);
    let sessionEnd = new Date(body.endTime);

    console.log(`[SESSIONS POST] Parsed times:`, {
      startTime: body.startTime,
      endTime: body.endTime,
      sessionStart: sessionStart.toISOString(),
      sessionEnd: sessionEnd.toISOString(),
      isValidStart: !isNaN(sessionStart.getTime()),
      isValidEnd: !isNaN(sessionEnd.getTime())
    });

    if (isNaN(sessionStart.getTime())) sessionStart = new Date();
    if (isNaN(sessionEnd.getTime())) sessionEnd = new Date(sessionStart.getTime() + 3600000);

    // Validation 1: End before start
    if (sessionEnd < sessionStart) {
      console.error(`[SESSIONS POST] Validation failed: End time before start time`);
      return NextResponse.json({ error: 'End time cannot be before start time' }, { status: 400 });
    }

    // Validation 2: Check session time is within event time range (STRICT)
    if (event.startsAt && event.endsAt) {
      const eventStart = new Date(event.startsAt);
      const eventEnd = new Date(event.endsAt);

      if (sessionStart < eventStart || sessionEnd > eventEnd) {
        const formatTime = (d: Date) => d.toLocaleString('en-IN', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        });
        return NextResponse.json({
          error: `Session time must be within event time range. Event runs from ${formatTime(eventStart)} to ${formatTime(eventEnd)}, but session is scheduled from ${formatTime(sessionStart)} to ${formatTime(sessionEnd)}.`
        }, { status: 400 });
      }
    }

    // Validation 4: No time conflicts for same room
    const sessionRoom = body.room?.toLowerCase()?.trim() || '';
    
    const overlapping = await prisma.$queryRaw`
      SELECT id, title, start_time, end_time, room
      FROM sessions
      WHERE event_id = ${eventId}
        AND LOWER(TRIM(COALESCE(room, ''))) = ${sessionRoom}
        AND (
          (${sessionStart} >= start_time AND ${sessionStart} < end_time)
          OR (${sessionEnd} > start_time AND ${sessionEnd} <= end_time)
          OR (${sessionStart} <= start_time AND ${sessionEnd} >= end_time)
        )
      LIMIT 1
    ` as any[]

    if (overlapping.length > 0) {
      return NextResponse.json({
        error: `Time conflict in room "${body.room || 'Default'}": This slot overlaps with "${overlapping[0].title}" (${new Date(overlapping[0].start_time).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})} - ${new Date(overlapping[0].end_time).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})})`
      }, { status: 400 });
    }

    // 3. Insert Session (include room field)
    const newSessionResult = await prisma.$queryRaw`
        INSERT INTO sessions (
            event_id, tenant_id, title, description, start_time, end_time, room, track, created_at, updated_at
        ) VALUES (
            ${eventId}, ${event.tenantId}, ${body.title}, ${body.description || null},
            ${sessionStart}, ${sessionEnd}, ${body.room || null}, ${body.track || null}, NOW(), NOW()
        )
        RETURNING id, event_id as "eventId", room
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
