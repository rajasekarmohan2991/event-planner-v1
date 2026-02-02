import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/events/[id]/rsvp - Check if user has RSVP'd
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ status: null });
    }

    const eventId = params.id;
    const userId = BigInt(session.user.id);

    const rsvp = await prisma.rSVP.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: userId,
        },
      },
    });

    return NextResponse.json({ status: rsvp?.status || null });
  } catch (error) {
    console.error('GET RSVP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/events/[id]/rsvp - Toggle "I am interested"
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const userId = BigInt(session.user.id);
    const userEmail = session.user.email;
    const body = await req.json(); // { status: 'INTERESTED' | 'NOT_GOING' }

    const status = body.status || 'INTERESTED';

    // Upsert RSVP
    const rsvp = await prisma.rSVP.upsert({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: userId,
        },
      },
      update: {
        status: status,
        email: userEmail,
      },
      create: {
        eventId: eventId,
        userId: userId,
        email: userEmail,
        status: status,
      },
    });

    return NextResponse.json(rsvp);
  } catch (error) {
    console.error('POST RSVP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
