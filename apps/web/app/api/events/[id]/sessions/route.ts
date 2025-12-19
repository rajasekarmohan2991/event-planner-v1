import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/events/[id]/sessions - List all sessions for an event
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = BigInt(params.id);

    // Fetch sessions with speakers
    const sessions = await prisma.eventSession.findMany({
      where: {
        eventId: eventId,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Fetch speakers for each session
    const sessionsWithSpeakers = await Promise.all(
      sessions.map(async (session) => {
        const speakers = await prisma.$queryRaw<any[]>`
          SELECT 
            s.id::text,
            s.name,
            s.title,
            s.bio,
            s.photo_url
          FROM speakers s
          INNER JOIN session_speakers ss ON s.id = ss.speaker_id
          WHERE ss.session_id = ${session.id}
        `;

        return {
          ...session,
          speakers: speakers || []
        };
      })
    );

    // Convert BigInt to string for JSON serialization
    const serializedSessions = sessionsWithSpeakers.map(s => ({
      ...s,
      id: s.id.toString(),
      eventId: s.eventId.toString(),
    }));

    return NextResponse.json({ sessions: serializedSessions });
  } catch (error) {
    console.error('GET /api/events/[id]/sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/events/[id]/sessions - Create a new session
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const eventId = BigInt(params.id);

    // Ensure dependent tables exist
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS session_speakers (
          id BIGSERIAL PRIMARY KEY,
          session_id BIGINT NOT NULL,
          speaker_id BIGINT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(session_id, speaker_id)
        );
        CREATE TABLE IF NOT EXISTS calendar_events (
          id BIGSERIAL PRIMARY KEY,
          event_id BIGINT NOT NULL,
          session_id BIGINT,
          title VARCHAR(255),
          description TEXT,
          start_time TIMESTAMP,
          end_time TIMESTAMP,
          location VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `)
    } catch (e) {
      // Ignore if exists
    }

    // Get event details for validation
    const eventResult = await prisma.$queryRaw<any[]>`
      SELECT tenant_id, starts_at as "startsAt", ends_at as "endsAt" FROM events WHERE id = ${eventId} LIMIT 1
    `;
    const eventData = eventResult[0];
    const tenantId = eventData?.tenant_id || null;

    if (!eventData) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Validate Session Timing
    const eventStart = new Date(eventData.startsAt);
    const eventEnd = new Date(eventData.endsAt);
    const sessionStart = new Date(body.startTime);
    const sessionEnd = new Date(body.endTime);

    if (sessionStart >= sessionEnd) {
      return NextResponse.json({
        error: 'Invalid session duration',
        message: 'Session start time must be before end time'
      }, { status: 400 });
    }

    // Allow 1 hour buffer? No, user said "strictly".
    if (sessionStart < eventStart || sessionEnd > eventEnd) {
      return NextResponse.json({
        error: 'Session outside event hours',
        message: `Session time (${sessionStart.toLocaleString()} - ${sessionEnd.toLocaleString()}) must be strictly within event duration (${eventStart.toLocaleString()} - ${eventEnd.toLocaleString()})`,
        range: {
          eventStart: eventStart.toISOString(),
          eventEnd: eventEnd.toISOString()
        }
      }, { status: 400 });
    }

    const newSession = await prisma.eventSession.create({
      data: {
        eventId: eventId,
        tenantId: tenantId,
        title: body.title,
        description: body.description || null,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        room: body.room || null,
        track: body.track || null,
        capacity: body.capacity ? parseInt(body.capacity) : null,
      },
    });

    // Link speakers to session if provided
    if (body.speakers && Array.isArray(body.speakers) && body.speakers.length > 0) {
      try {
        // Create session-speaker relationships (table only has session_id and speaker_id)
        for (const speakerId of body.speakers) {
          await prisma.$executeRaw`
            INSERT INTO session_speakers (session_id, speaker_id)
            VALUES (${newSession.id}, ${speakerId})
            ON CONFLICT (session_id, speaker_id) DO NOTHING
          `
        }
      } catch (speakerError) {
        console.error('Error linking speakers:', speakerError)
        // Continue even if speaker linking fails
      }
    }

    // Add to calendar if requested
    if (body.addToCalendar) {
      try {
        // Create calendar event entry
        await prisma.$executeRaw`
          INSERT INTO calendar_events (
            event_id, 
            session_id, 
            title, 
            description, 
            start_time, 
            end_time, 
            location, 
            created_at
          )
          VALUES (
            ${eventId}, 
            ${newSession.id}, 
            ${body.title}, 
            ${body.description || ''}, 
            ${new Date(body.startTime)}, 
            ${new Date(body.endTime)}, 
            ${body.room || ''}, 
            NOW()
          )
        `
      } catch (calendarError) {
        console.error('Error adding to calendar:', calendarError)
        // Continue even if calendar creation fails
      }
    }

    // Convert BigInt to string for JSON serialization
    const serializedSession = {
      ...newSession,
      id: newSession.id.toString(),
      eventId: newSession.eventId.toString(),
      speakers: body.speakers || [],
      addedToCalendar: body.addToCalendar || false,
    };

    return NextResponse.json(serializedSession, { status: 201 });
  } catch (error) {
    console.error('POST /api/events/[id]/sessions error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
