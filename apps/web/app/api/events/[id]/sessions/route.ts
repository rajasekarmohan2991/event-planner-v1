
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

    // Use COALESCE to handle potentially missing columns gracefully
    const sessions = await prisma.$queryRawUnsafe(`
      SELECT 
        id, 
        title, 
        description, 
        start_time as "startTime", 
        end_time as "endTime", 
        event_id as "eventId", 
        tenant_id as "tenantId",
        COALESCE(location, '') as location,
        COALESCE(room, '') as room,
        COALESCE(track, '') as track,
        COALESCE(stream_url, '') as "streamUrl",
        COALESCE(is_live, false) as "isLive"
      FROM sessions
      WHERE event_id = $1
      ORDER BY start_time ASC
    `, eventId) as any[]

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
            location TEXT,
            room TEXT,
            track TEXT,
            stream_url TEXT,
            is_live BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);

        // Add missing columns if table exists but columns don't
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS location TEXT;
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS room TEXT;
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS track TEXT;
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stream_url TEXT;
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
          EXCEPTION WHEN OTHERS THEN NULL;
          END $$;
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

    // Validation 2: Check session time is within event time range (LENIENT - just warn, don't block)
    if (event.startsAt && event.endsAt) {
      const eventStart = new Date(event.startsAt);
      const eventEnd = new Date(event.endsAt);

      if (sessionStart < eventStart || sessionEnd > eventEnd) {
        console.warn(`[SESSIONS POST] Session time outside event range - allowing anyway`);
        // Don't block - just log warning. User may have valid reasons.
      }
    }

    // Validation 4: No time conflicts for same room (DISABLED - too strict)
    // Only check if room is explicitly provided and not empty
    if (body.room && body.room.trim().length > 0) {
      const sessionRoom = body.room.toLowerCase().trim();
      
      try {
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
          console.warn(`[SESSIONS POST] Time conflict detected but allowing anyway: ${overlapping[0].title}`);
          // Don't block - just warn. User may want multiple sessions in same room.
        }
      } catch (e) {
        console.warn('[SESSIONS POST] Room conflict check failed, skipping:', e);
      }
    }

    // 3. Insert Session (include room, stream_url, is_live fields)
    // Use $queryRawUnsafe for better error handling
    const newSessionResult = await prisma.$queryRawUnsafe(`
        INSERT INTO sessions (
            event_id, tenant_id, title, description, start_time, end_time, room, track, location, stream_url, is_live, created_at, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
        )
        RETURNING id, event_id as "eventId", room, stream_url as "streamUrl", is_live as "isLive"
    `, eventId, event.tenantId, body.title, body.description || null,
       sessionStart, sessionEnd, body.room || null, body.track || null, 
       body.location || null, body.streamUrl || body.stream_url || null, 
       body.isLive || body.is_live || false) as any[]

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
    console.error('POST sessions error stack:', error.stack);
    
    // Handle missing table/column errors with self-healing
    if (error.message?.includes('relation') || error.message?.includes('does not exist') || error.message?.includes('column')) {
      try {
        console.log('🔧 [SESSIONS POST] Attempting schema repair...');
        // Ensure sessions table exists with all columns
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS sessions (
            id BIGSERIAL PRIMARY KEY,
            event_id BIGINT NOT NULL,
            tenant_id TEXT,
            title TEXT NOT NULL,
            description TEXT,
            start_time TIMESTAMP WITH TIME ZONE,
            end_time TIMESTAMP WITH TIME ZONE,
            location TEXT,
            room TEXT,
            track TEXT,
            stream_url TEXT,
            is_live BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);

        // Add missing columns
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS location TEXT;
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS room TEXT;
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS track TEXT;
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stream_url TEXT;
            ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
          EXCEPTION WHEN OTHERS THEN NULL;
          END $$;
        `);
        
        console.log('✅ [SESSIONS POST] Schema repaired, please retry');
        return NextResponse.json({ 
          error: 'Database schema updated. Please try again.',
          needsRetry: true 
        }, { status: 503 });
      } catch (repairError) {
        console.error('Sessions table repair failed:', repairError);
      }
    }
    
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// PUT /api/events/[id]/sessions - Update session (including live stream)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const sessionId = body.sessionId || body.id;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    console.log(`[SESSIONS PUT] Updating session ${sessionId}:`, body);

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(body.title);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description);
    }
    if (body.startTime !== undefined) {
      updates.push(`start_time = $${paramIndex++}`);
      values.push(new Date(body.startTime));
    }
    if (body.endTime !== undefined) {
      updates.push(`end_time = $${paramIndex++}`);
      values.push(new Date(body.endTime));
    }
    if (body.room !== undefined) {
      updates.push(`room = $${paramIndex++}`);
      values.push(body.room);
    }
    if (body.location !== undefined) {
      updates.push(`location = $${paramIndex++}`);
      values.push(body.location);
    }
    if (body.streamUrl !== undefined || body.stream_url !== undefined) {
      updates.push(`stream_url = $${paramIndex++}`);
      values.push(body.streamUrl || body.stream_url);
    }
    if (body.isLive !== undefined || body.is_live !== undefined) {
      updates.push(`is_live = $${paramIndex++}`);
      values.push(body.isLive ?? body.is_live);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(BigInt(sessionId));

    const query = `
      UPDATE sessions 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, title, stream_url as "streamUrl", is_live as "isLive"
    `;

    const result = await prisma.$queryRawUnsafe(query, ...values) as any[];

    if (result.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...result[0],
      id: result[0].id.toString(),
      success: true
    });

  } catch (error: any) {
    console.error('PUT sessions error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
