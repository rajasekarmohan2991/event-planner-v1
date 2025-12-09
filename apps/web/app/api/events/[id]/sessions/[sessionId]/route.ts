import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/events/[id]/sessions/[sessionId] - Get single session
export async function GET(req: NextRequest, { params }: { params: { id: string, sessionId: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = BigInt(params.sessionId);
    
    // Get session with speaker details using raw SQL
    const sessions = await prisma.$queryRaw<any[]>`
      SELECT 
        s.id::text,
        s.event_id::text as "eventId",
        s.title,
        s.description,
        s.start_time as "startTime",
        s.end_time as "endTime",
        s.room,
        s.track,
        s.capacity,
        s.created_at as "createdAt",
        s.updated_at as "updatedAt"
      FROM sessions s
      WHERE s.id = ${sessionId}
    `;

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const eventSession = sessions[0];
    
    // Get speaker details from session_speakers junction table
    let speakers = [];
    try {
      const speakerResults = await prisma.$queryRaw<any[]>`
        SELECT 
          sp.id::text,
          sp.name,
          sp.title,
          sp.bio,
          sp.company,
          sp.email,
          sp.photo_url as "photoUrl"
        FROM speakers sp
        INNER JOIN session_speakers ss ON sp.id = ss.speaker_id
        WHERE ss.session_id = ${sessionId}
      `;
      
      speakers = speakerResults;
    } catch (e) {
      console.error('Error fetching speakers:', e);
    }

    return NextResponse.json({
      ...eventSession,
      speakers
    });
  } catch (error) {
    console.error('GET session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/events/[id]/sessions/[sessionId] - Update session
export async function PUT(req: NextRequest, { params }: { params: { id: string, sessionId: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const sessionId = BigInt(params.sessionId);

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.startTime !== undefined) updateData.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) updateData.endTime = new Date(body.endTime);
    if (body.room !== undefined) updateData.room = body.room || null;
    if (body.track !== undefined) updateData.track = body.track || null;
    if (body.capacity !== undefined) updateData.capacity = body.capacity ? parseInt(body.capacity) : null;

    const updatedSession = await prisma.eventSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    const serialized = {
      ...updatedSession,
      id: updatedSession.id.toString(),
      eventId: updatedSession.eventId.toString(),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('PUT session error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}

// DELETE /api/events/[id]/sessions/[sessionId] - Delete session
export async function DELETE(_req: NextRequest, { params }: { params: { id: string, sessionId: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionId = BigInt(params.sessionId);

    await prisma.eventSession.delete({
      where: { id: sessionId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE session error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
