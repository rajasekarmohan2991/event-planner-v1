import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/signatures/[token] - Get signature request details (public)
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ token: string }> | { token: string } }
) {
    try {
        const params = 'then' in context.params ? await context.params : context.params;
        const token = params.token;

        const signatures: any = await prisma.$queryRaw`
      SELECT 
        sr.id,
        sr.signer_name as "signerName",
        sr.signer_email as "signerEmail",
        sr.document_content as "documentContent",
        sr.document_type as "documentType",
        sr.entity_type as "entityType",
        sr.status,
        sr.token_expires_at as "tokenExpiresAt",
        sr.signed_at as "signedAt",
        e.name as "eventName",
        e.id as "eventId"
      FROM signature_requests sr
      JOIN events e ON sr.event_id = e.id
      WHERE sr.signature_token = ${token}
      LIMIT 1
    `;

        if (!signatures || signatures.length === 0) {
            return NextResponse.json(
                { error: 'Signature request not found' },
                { status: 404 }
            );
        }

        const signature = signatures[0];

        // Check if expired
        const now = new Date();
        const expiresAt = new Date(signature.tokenExpiresAt);

        if (now > expiresAt && signature.status === 'PENDING') {
            // Update status to expired
            await prisma.$executeRaw`
        UPDATE signature_requests
        SET status = 'EXPIRED'
        WHERE signature_token = ${token}
      `;

            signature.status = 'EXPIRED';
        }

        // Log view action
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await prisma.$executeRaw`
      INSERT INTO signature_audit_log (
        signature_request_id,
        action,
        ip_address,
        user_agent
      ) VALUES (
        ${signature.id}::uuid,
        'VIEWED',
        ${ipAddress},
        ${userAgent}
      )
    `;

        return NextResponse.json({ signature }, { status: 200 });
    } catch (error) {
        console.error('Error fetching signature request:', error);
        return NextResponse.json(
            { error: 'Failed to fetch signature request' },
            { status: 500 }
        );
    }
}

// POST /api/signatures/[token]/sign - Sign the document
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ token: string }> | { token: string } }
) {
    try {
        const params = 'then' in context.params ? await context.params : context.params;
        const token = params.token;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'You must be logged in to sign' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { agreed } = body;

        if (!agreed) {
            return NextResponse.json(
                { error: 'You must agree to the terms' },
                { status: 400 }
            );
        }

        // Get signature request
        const signatures: any = await prisma.$queryRaw`
      SELECT 
        id,
        signer_email as "signerEmail",
        status,
        token_expires_at as "tokenExpiresAt"
      FROM signature_requests
      WHERE signature_token = ${token}
      LIMIT 1
    `;

        if (!signatures || signatures.length === 0) {
            return NextResponse.json(
                { error: 'Signature request not found' },
                { status: 404 }
            );
        }

        const signature = signatures[0];

        // Validate email matches
        const userEmail = (session.user as any)?.email;
        if (userEmail.toLowerCase() !== signature.signerEmail.toLowerCase()) {
            return NextResponse.json(
                {
                    error: 'Email mismatch',
                    message: `You must login with the invited email: ${signature.signerEmail}`
                },
                { status: 403 }
            );
        }

        // Check if already signed
        if (signature.status === 'COMPLETED') {
            return NextResponse.json(
                { error: 'Document already signed' },
                { status: 400 }
            );
        }

        // Check if expired
        const now = new Date();
        const expiresAt = new Date(signature.tokenExpiresAt);

        if (now > expiresAt) {
            return NextResponse.json(
                { error: 'Signature link has expired' },
                { status: 400 }
            );
        }

        // Update signature request
        const userId = (session.user as any)?.id;
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await prisma.$executeRaw`
      UPDATE signature_requests
      SET 
        status = 'COMPLETED',
        signed_at = NOW(),
        signed_by_user_id = ${userId ? BigInt(userId) : null},
        signature_ip_address = ${ipAddress},
        signature_user_agent = ${userAgent},
        updated_at = NOW()
      WHERE signature_token = ${token}
    `;

        // Log signature action
        await prisma.$executeRaw`
      INSERT INTO signature_audit_log (
        signature_request_id,
        action,
        performed_by,
        ip_address,
        user_agent
      ) VALUES (
        ${signature.id}::uuid,
        'SIGNED',
        ${userId ? BigInt(userId) : null},
        ${ipAddress},
        ${userAgent}
      )
    `;

        // TODO: Send confirmation email

        return NextResponse.json(
            { message: 'Document signed successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error signing document:', error);
        return NextResponse.json(
            { error: 'Failed to sign document' },
            { status: 500 }
        );
    }
}
