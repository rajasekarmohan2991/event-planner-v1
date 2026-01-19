import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { docuSignClient } from '@/lib/docusign';

export const dynamic = 'force-dynamic';

// GET /api/signatures/[id] - Get signature request details
// Supports both ID-based (authenticated) and token-based (public) access
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const identifier = params.id;
    
    try {
        // Check if this is a UUID (ID) or a token (longer string)
        const isToken = identifier.length > 36;
        
        if (isToken) {
            // Public token-based access
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
                WHERE sr.signature_token = ${identifier}
                LIMIT 1
            `;

            if (!signatures || signatures.length === 0) {
                return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
            }

            const signature = signatures[0];

            // Check if expired
            const now = new Date();
            const expiresAt = new Date(signature.tokenExpiresAt);

            if (now > expiresAt && signature.status === 'PENDING') {
                await prisma.$executeRaw`
                    UPDATE signature_requests
                    SET status = 'EXPIRED'
                    WHERE signature_token = ${identifier}
                `;
                signature.status = 'EXPIRED';
            }

            // Log view action
            const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
            const userAgent = req.headers.get('user-agent') || 'unknown';

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
        } else {
            // ID-based authenticated access
            const session = await getServerSession(authOptions as any);
            if (!session?.user) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const signatures: any[] = await prisma.$queryRawUnsafe(`
                SELECT 
                    id,
                    tenant_id as "tenantId",
                    event_id as "eventId",
                    document_type as "documentType",
                    document_title as "documentTitle",
                    signer_email as "signerEmail",
                    signer_name as "signerName",
                    signer_type as "signerType",
                    signer_id as "signerId",
                    envelope_id as "envelopeId",
                    signing_url as "signingUrl",
                    status,
                    sent_at as "sentAt",
                    viewed_at as "viewedAt",
                    signed_at as "signedAt",
                    completed_at as "completedAt",
                    signed_document_url as "signedDocumentUrl",
                    signature_image_url as "signatureImageUrl",
                    custom_fields as "customFields",
                    expires_at as "expiresAt",
                    created_at as "createdAt"
                FROM signature_requests
                WHERE id = $1
            `, identifier);

            if (signatures.length === 0) {
                return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
            }

            return NextResponse.json({ signature: signatures[0] });
        }
    } catch (error: any) {
        console.error('Error fetching signature:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch signature',
            details: error.message 
        }, { status: 500 });
    }
}

// POST /api/signatures/[id] - Sign document (token-based)
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const identifier = params.id;
    
    // Only support token-based signing via POST
    const isToken = identifier.length > 36;
    if (!isToken) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'You must be logged in to sign' }, { status: 401 });
        }

        const body = await req.json();
        const { agreed } = body;

        if (!agreed) {
            return NextResponse.json({ error: 'You must agree to the terms' }, { status: 400 });
        }

        // Get signature request
        const signatures: any = await prisma.$queryRaw`
            SELECT 
                id,
                signer_email as "signerEmail",
                status,
                token_expires_at as "tokenExpiresAt"
            FROM signature_requests
            WHERE signature_token = ${identifier}
            LIMIT 1
        `;

        if (!signatures || signatures.length === 0) {
            return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
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
            return NextResponse.json({ error: 'Document already signed' }, { status: 400 });
        }

        // Check if expired
        const now = new Date();
        const expiresAt = new Date(signature.tokenExpiresAt);

        if (now > expiresAt) {
            return NextResponse.json({ error: 'Signature link has expired' }, { status: 400 });
        }

        // Update signature request
        const userId = (session.user as any)?.id;
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        await prisma.$executeRaw`
            UPDATE signature_requests
            SET 
                status = 'COMPLETED',
                signed_at = NOW(),
                signed_by_user_id = ${userId ? BigInt(userId) : null},
                signature_ip_address = ${ipAddress},
                signature_user_agent = ${userAgent},
                updated_at = NOW()
            WHERE signature_token = ${identifier}
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

        return NextResponse.json({ message: 'Document signed successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('Error signing document:', error);
        return NextResponse.json({ error: 'Failed to sign document' }, { status: 500 });
    }
}

// PATCH /api/signatures/[id] - Update signature status (for webhook or manual update)
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { status, signedDocumentUrl, signatureImageUrl, signerIp, userAgent } = body;

        // Build update query
        let updateFields: string[] = ['updated_at = NOW()'];
        const updateParams: any[] = [];
        let paramIndex = 1;

        if (status) {
            updateFields.push(`status = $${paramIndex}`);
            updateParams.push(status);
            paramIndex++;

            // Set timestamp based on status
            if (status === 'VIEWED') {
                updateFields.push(`viewed_at = NOW()`);
            } else if (status === 'SIGNED' || status === 'COMPLETED') {
                updateFields.push(`signed_at = NOW()`);
                updateFields.push(`completed_at = NOW()`);
            }
        }

        if (signedDocumentUrl) {
            updateFields.push(`signed_document_url = $${paramIndex}`);
            updateParams.push(signedDocumentUrl);
            paramIndex++;
        }

        if (signatureImageUrl) {
            updateFields.push(`signature_image_url = $${paramIndex}`);
            updateParams.push(signatureImageUrl);
            paramIndex++;
        }

        if (signerIp) {
            updateFields.push(`signer_ip = $${paramIndex}`);
            updateParams.push(signerIp);
            paramIndex++;
        }

        if (userAgent) {
            updateFields.push(`user_agent = $${paramIndex}`);
            updateParams.push(userAgent);
            paramIndex++;
        }

        updateParams.push(params.id);

        await prisma.$executeRawUnsafe(`
            UPDATE signature_requests
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
        `, ...updateParams);

        return NextResponse.json({ success: true, message: 'Signature updated' });
    } catch (error: any) {
        console.error('Error updating signature:', error);
        return NextResponse.json({ 
            error: 'Failed to update signature',
            details: error.message 
        }, { status: 500 });
    }
}

// DELETE /api/signatures/[id] - Void/cancel signature request
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get signature request
        const signatures: any[] = await prisma.$queryRawUnsafe(`
            SELECT envelope_id as "envelopeId", status
            FROM signature_requests
            WHERE id = $1
        `, params.id);

        if (signatures.length === 0) {
            return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
        }

        const signature = signatures[0];

        // If already completed, can't void
        if (signature.status === 'COMPLETED' || signature.status === 'SIGNED') {
            return NextResponse.json({ 
                error: 'Cannot void a completed signature' 
            }, { status: 400 });
        }

        // Void in DocuSign if envelope exists
        if (signature.envelopeId && process.env.DOCUSIGN_INTEGRATION_KEY) {
            try {
                await docuSignClient.voidEnvelope(signature.envelopeId, 'Cancelled by user');
            } catch (e) {
                console.error('DocuSign void error:', e);
            }
        }

        // Update status to voided
        await prisma.$executeRawUnsafe(`
            UPDATE signature_requests
            SET status = 'VOIDED', updated_at = NOW()
            WHERE id = $1
        `, params.id);

        return NextResponse.json({ success: true, message: 'Signature request voided' });
    } catch (error: any) {
        console.error('Error voiding signature:', error);
        return NextResponse.json({ 
            error: 'Failed to void signature',
            details: error.message 
        }, { status: 500 });
    }
}
