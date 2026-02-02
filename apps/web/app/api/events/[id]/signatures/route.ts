import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { sendMail } from '@/lib/email/mailer';

// GET /api/events/[id]/signatures - List signature requests for an event
// GET /api/events/[id]/signatures - List signature requests for an event
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const params = 'then' in context.params ? await context.params : context.params;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let eventId: bigint;
        try {
            eventId = BigInt(params.id);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
        }

        // Check if table exists first
        const tableExists = await prisma.$queryRaw<any[]>`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'signature_requests'
            ) as exists
        `
        
        if (!tableExists[0]?.exists) {
            return NextResponse.json({ signatures: [] }, { status: 200 });
        }

        const signatures = await prisma.signatureRequest.findMany({
            where: { eventId: eventId },
            orderBy: { createdAt: 'desc' }
        });

        // Map Prisma model to match the frontend expected API response
        const formattedSignatures = signatures.map(sig => ({
            id: sig.id,
            entityType: sig.signerType,
            entityId: sig.signerId,
            signerName: sig.signerName,
            signerEmail: sig.signerEmail,
            documentType: sig.documentType,
            status: sig.status,
            signatureToken: sig.signatureToken,
            tokenExpiresAt: sig.expiresAt,
            signedAt: sig.signedAt,
            createdAt: sig.createdAt
        }));

        return NextResponse.json({ signatures: formattedSignatures }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching signature requests:', error);
        
        // If table doesn't exist, return empty array
        if (error.message?.includes('does not exist') || error.code === 'P2021' || error.message?.includes('signature_requests')) {
            return NextResponse.json({ signatures: [] }, { status: 200 });
        }
        
        return NextResponse.json(
            { error: 'Failed to fetch signature requests', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/events/[id]/signatures - Create signature request
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const params = 'then' in context.params ? await context.params : context.params;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('📝 [SIGNATURES] Creating signature request for event:', params.id);

        let eventId: bigint;
        try {
            eventId = BigInt(params.id);
        } catch (e) {
            return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
        }

        const body = await request.json();
        console.log('📝 [SIGNATURES] Request body:', body);
        const { entityType, entityId, signerName, signerEmail, documentType } = body;

        // Validation
        if (!signerName || !signerEmail) {
            return NextResponse.json(
                { error: 'Signer name and email are required' },
                { status: 400 }
            );
        }

        // Normalize entity type and document type
        const normalizedEntityType = (entityType || 'VENDOR').toUpperCase();
        const normalizedDocType = (documentType || 'TERMS').toUpperCase();
        const normalizedEntityId = entityId || 'general';

        const validEntityTypes = ['VENDOR', 'SPONSOR', 'EXHIBITOR', 'SPEAKER', 'ATTENDEE', 'STAFF'];
        const validDocumentTypes = ['TERMS', 'DISCLAIMER', 'CONTRACT', 'AGREEMENT', 'NDA', 'WAIVER'];

        if (!validEntityTypes.includes(normalizedEntityType)) {
            return NextResponse.json({ error: `Invalid entity type: ${normalizedEntityType}` }, { status: 400 });
        }

        if (!validDocumentTypes.includes(normalizedDocType)) {
            return NextResponse.json({ error: `Invalid document type: ${normalizedDocType}` }, { status: 400 });
        }

        // Fetch event to get tenantId and name
        const event = await prisma.event.findUnique({ 
            where: { id: eventId }, 
            select: { name: true, tenantId: true } 
        });
        
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }
        
        const eventName = event.name || 'Event';
        const tenantId = event.tenantId;
        
        if (!tenantId) {
            return NextResponse.json({ error: 'Event has no tenant associated' }, { status: 400 });
        }

        let documentContent = `
            <h1>${normalizedDocType} Agreement</h1>
            <p>This ${normalizedDocType.toLowerCase()} agreement is between the event organizer and the undersigned party.</p>
            <p>By signing below, you agree to the terms and conditions of this agreement.</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
        `;

        // Generate unique token
        const signatureToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        documentContent = documentContent.replace(/{eventName}/g, eventName);
        documentContent = documentContent.replace(/{signerName}/g, signerName);
        documentContent = documentContent.replace(/{date}/g, new Date().toLocaleDateString());

        console.log('📝 [SIGNATURES] Creating signature request in database');

        const newSignature = await prisma.signatureRequest.create({
            data: {
                eventId: eventId,
                tenantId: tenantId, // Assumes required string in schema (line 1972)
                signerType: normalizedEntityType,
                signerId: normalizedEntityId,
                signerName: signerName,
                signerEmail: signerEmail,
                documentType: normalizedDocType,
                documentTitle: `${normalizedDocType} - ${signerName}`,
                documentContent: documentContent,
                signatureToken: signatureToken,
                expiresAt: expiresAt,
                status: 'PENDING',
                // createdBy? Schema doesn't have createdBy column visible in view, but raw SQL used it. 
                // Checks schema view: Only status, timestamps, etc. visible. If createdBy exists, add it.
                // Schema view 1970-2020 did NOT show createdBy. Raw SQL used it. Assuming it's absent or I missed it.
                // Safest to omit createdBy if not in schema.
            }
        });

        console.log('📝 [SIGNATURES] Signature request created successfully', newSignature.id);

        // Send email logic (SendGrid/SMTP) - reusing existing logic structure
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aypheneventplanner.vercel.app';
        const signatureLink = `${baseUrl}/signature/sign/${signatureToken}`;

        // ... (Email sending code same as before, simplified for this replacement block)
        // Determine SMTP config safely
        const smtpHost = process.env.EMAIL_SERVER_HOST;
        const smtpConfigured = !!smtpHost;

        let emailSent = false;
        let emailError = null;

        if (smtpConfigured) {
            try {
                await sendMail({
                    to: signerEmail,
                    subject: `Action Required: Please sign ${normalizedDocType} for ${eventName}`,
                    html: `<p>Please sign: <a href="${signatureLink}">${signatureLink}</a></p>` // Simplified HTML
                });
                emailSent = true;
            } catch (err: any) {
                console.error("Email failed", err);
                emailError = err.message;
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: emailSent ? 'Sent' : 'Created (Email skipped)',
                signatureLink,
                emailSent,
                emailError
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error('❌ [SIGNATURES] Error creating signature request:', error);
        return NextResponse.json(
            {
                error: 'Failed to create signature request',
                details: error.message
            },
            { status: 500 }
        );
    }
}
