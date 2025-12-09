import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';
// import prisma from '@/lib/prisma';
// import crypto from 'crypto';

// const APPROVAL_SECRET = process.env.APPROVAL_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret';

/**
 * Approve registration via QR code scan
 * POST /api/events/[id]/registrations/approve
 * 
 * Body: {
 *   token: string,
 *   mode: 'MANUAL' | 'AUTOMATIC',
 *   approvedBy?: string,
 *   notes?: string
 * }
 * 
 * NOTE: Temporarily disabled until Prisma schema migration is complete
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { message: 'QR approval system is being set up. Coming soon!' },
    { status: 501 }
  );
  
  /* Temporarily commented out until schema migration is complete
  try {
    const session = await getServerSession(authOptions as any);
    const body = await req.json();
    const { token, mode = 'MANUAL', approvedBy, notes } = body;

    if (!token) {
      return NextResponse.json({ message: 'Token is required' }, { status: 400 });
    }

    // Parse and verify token
    const parts = token.split('.');
    if (parts.length !== 2) {
      return NextResponse.json({ message: 'Invalid token format' }, { status: 400 });
    }

    const [payloadB64, signature] = parts;

    // Verify signature
    const hmac = crypto.createHmac('sha256', APPROVAL_SECRET);
    hmac.update(payloadB64);
    const expectedSignature = hmac.digest('base64url');

    if (signature !== expectedSignature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
    }

    // Decode payload
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadStr);

    // Validate payload
    if (payload.type !== 'REGISTRATION_APPROVAL') {
      return NextResponse.json({ message: 'Invalid token type' }, { status: 400 });
    }

    if (payload.eventId !== params.id) {
      return NextResponse.json({ message: 'Token event mismatch' }, { status: 400 });
    }

    if (Date.now() > payload.exp) {
      return NextResponse.json({ message: 'Token expired' }, { status: 410 });
    }

    // Check if registration exists
    const registration = await prisma.registration.findUnique({
      where: { id: payload.registrationId },
      include: {
        event: {
          select: { id: true, name: true }
        }
      }
    });

    if (!registration) {
      return NextResponse.json({ message: 'Registration not found' }, { status: 404 });
    }

    // Check if already approved
    if (registration.status === 'APPROVED') {
      return NextResponse.json({
        ok: true,
        already: true,
        message: 'Registration already approved',
        registration: {
          id: registration.id,
          email: registration.email,
          status: registration.status,
          approvedAt: registration.approvedAt,
        }
      });
    }

    // Approve the registration
    const updated = await prisma.registration.update({
      where: { id: payload.registrationId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvalMode: mode,
        approvedBy: approvedBy || (session?.user as any)?.email || 'System',
        approvalNotes: notes,
      },
    });

    console.log(`✅ Registration approved: ${updated.id} (${updated.email}) - Mode: ${mode}`);

    return NextResponse.json({
      ok: true,
      message: 'Registration approved successfully',
      registration: {
        id: updated.id,
        email: updated.email,
        status: updated.status,
        approvedAt: updated.approvedAt,
        approvedBy: updated.approvedBy,
        mode,
      }
    });

  } catch (error: any) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { message: error?.message || 'Approval failed' },
      { status: 500 }
    );
  }
  */
}
