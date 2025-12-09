import { NextRequest, NextResponse } from 'next/server';
// import crypto from 'crypto';

// const APPROVAL_SECRET = process.env.APPROVAL_SECRET || process.env.NEXTAUTH_SECRET || 'default-secret';

/**
 * Generate QR code token for registration approval
 * GET /api/events/[id]/registrations/[registrationId]/qr
 * 
 * NOTE: Temporarily disabled until Prisma schema migration is complete
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; registrationId: string } }
) {
  return NextResponse.json(
    { message: 'QR generation system is being set up. Coming soon!' },
    { status: 501 }
  );
  
  /* Temporarily commented out until schema migration is complete
  try {
    const { id: eventId, registrationId } = params;

    // Create signed token payload
    const payload = {
      eventId,
      registrationId,
      type: 'REGISTRATION_APPROVAL',
      iat: Date.now(),
      exp: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    // Sign the payload
    const payloadStr = JSON.stringify(payload);
    const payloadB64 = Buffer.from(payloadStr).toString('base64url');
    const hmac = crypto.createHmac('sha256', APPROVAL_SECRET);
    hmac.update(payloadB64);
    const signature = hmac.digest('base64url');

    // Combine payload + signature
    const token = `${payloadB64}.${signature}`;

    return NextResponse.json({
      token,
      qrData: token,
      payload,
      expiresAt: new Date(payload.exp).toISOString(),
    });
  } catch (error: any) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to generate QR code' },
      { status: 500 }
    );
  }
  */
}
