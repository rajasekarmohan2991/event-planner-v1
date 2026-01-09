import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { docuSignClient } from '@/lib/docusign';

export const dynamic = 'force-dynamic';

// GET /api/signatures/[id] - Get signature request details
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
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
        `, params.id);

        if (signatures.length === 0) {
            return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
        }

        return NextResponse.json({ signature: signatures[0] });
    } catch (error: any) {
        console.error('Error fetching signature:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch signature',
            details: error.message 
        }, { status: 500 });
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
