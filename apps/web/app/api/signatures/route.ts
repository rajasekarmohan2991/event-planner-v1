import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { docuSignClient, DOCUMENT_TEMPLATES, SignatureDocumentType } from '@/lib/docusign';

export const dynamic = 'force-dynamic';

// GET /api/signatures - List signature requests
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = session.user as any;
        const searchParams = req.nextUrl.searchParams;
        const tenantId = searchParams.get('tenantId') || user.currentTenantId;
        const eventId = searchParams.get('eventId');
        const documentType = searchParams.get('documentType');
        const status = searchParams.get('status');
        const signerType = searchParams.get('signerType');

        // Build filter conditions
        let whereClause = `WHERE tenant_id = $1`;
        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (eventId) {
            whereClause += ` AND event_id = $${paramIndex}`;
            params.push(BigInt(eventId));
            paramIndex++;
        }

        if (documentType) {
            whereClause += ` AND document_type = $${paramIndex}`;
            params.push(documentType);
            paramIndex++;
        }

        if (status) {
            whereClause += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (signerType) {
            whereClause += ` AND signer_type = $${paramIndex}`;
            params.push(signerType);
            paramIndex++;
        }

        const signatures = await prisma.$queryRawUnsafe(`
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
                status,
                sent_at as "sentAt",
                viewed_at as "viewedAt",
                signed_at as "signedAt",
                completed_at as "completedAt",
                signed_document_url as "signedDocumentUrl",
                expires_at as "expiresAt",
                created_at as "createdAt"
            FROM signature_requests
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT 100
        `, ...params);

        return NextResponse.json({ signatures });
    } catch (error: any) {
        console.error('Error fetching signatures:', error);
        
        // If table doesn't exist, return empty array
        if (error.message?.includes('does not exist')) {
            return NextResponse.json({ signatures: [] });
        }
        
        return NextResponse.json({ 
            error: 'Failed to fetch signatures',
            details: error.message 
        }, { status: 500 });
    }
}

// POST /api/signatures - Create and send signature request
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = session.user as any;
        const body = await req.json();
        const {
            documentType,
            signerEmail,
            signerName,
            signerType,
            signerId,
            eventId,
            eventName,
            tenantId,
            customFields,
            useDocuSign = false // Flag to use DocuSign or simple signature
        } = body;

        const finalTenantId = tenantId || user.currentTenantId;

        // Validate required fields
        if (!documentType || !signerEmail || !signerName || !signerType) {
            return NextResponse.json({ 
                error: 'Missing required fields',
                details: 'documentType, signerEmail, signerName, and signerType are required'
            }, { status: 400 });
        }

        // Validate document type
        if (!DOCUMENT_TEMPLATES[documentType as SignatureDocumentType]) {
            return NextResponse.json({ 
                error: 'Invalid document type',
                validTypes: Object.keys(DOCUMENT_TEMPLATES)
            }, { status: 400 });
        }

        const template = DOCUMENT_TEMPLATES[documentType as SignatureDocumentType];

        // Get company details
        const companies: any[] = await prisma.$queryRawUnsafe(`
            SELECT name FROM tenants WHERE id = $1
        `, finalTenantId);
        const companyName = companies[0]?.name || 'Company';

        let envelopeId = null;
        let signingUrl = null;
        let status = 'PENDING';

        // If DocuSign is configured and requested, use it
        if (useDocuSign && process.env.DOCUSIGN_INTEGRATION_KEY) {
            try {
                const response = await docuSignClient.createEnvelope({
                    documentType: documentType as SignatureDocumentType,
                    signerEmail,
                    signerName,
                    eventId,
                    eventName,
                    tenantId: finalTenantId,
                    companyName,
                    customFields,
                    returnUrl: `${process.env.NEXTAUTH_URL}/signature/complete`
                });

                envelopeId = response.envelopeId;
                signingUrl = response.signingUrl;
                status = 'SENT';
            } catch (docuSignError: any) {
                console.error('DocuSign error:', docuSignError);
                // Continue without DocuSign, use simple signature
            }
        }

        // Create signature request record
        const id = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await prisma.$executeRawUnsafe(`
            INSERT INTO signature_requests (
                id, tenant_id, event_id, document_type, document_title,
                signer_email, signer_name, signer_type, signer_id,
                envelope_id, signing_url, status, sent_at, expires_at,
                custom_fields, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
            )
        `, 
            id,
            finalTenantId,
            eventId ? BigInt(eventId) : null,
            documentType,
            template.title,
            signerEmail,
            signerName,
            signerType,
            signerId || null,
            envelopeId,
            signingUrl,
            status,
            status === 'SENT' ? new Date() : null,
            expiresAt,
            customFields ? JSON.stringify(customFields) : null
        );

        // Generate simple signing URL if not using DocuSign
        if (!signingUrl) {
            signingUrl = `${process.env.NEXTAUTH_URL}/signature/sign/${id}`;
        }

        return NextResponse.json({
            success: true,
            signature: {
                id,
                documentType,
                documentTitle: template.title,
                signerEmail,
                signerName,
                signerType,
                status,
                signingUrl,
                envelopeId,
                expiresAt
            }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating signature request:', error);
        return NextResponse.json({ 
            error: 'Failed to create signature request',
            details: error.message 
        }, { status: 500 });
    }
}
