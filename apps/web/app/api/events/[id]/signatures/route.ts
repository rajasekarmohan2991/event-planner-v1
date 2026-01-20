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

        const eventId = BigInt(params.id);

        // Usage of raw SQL to fetch 'signature_token' which is present in DB but missing in Prisma Schema
        const signatures: any = await prisma.$queryRaw`
      SELECT 
        id,
        entity_type as "entityType",
        entity_id as "entityId",
        signer_name as "signerName",
        signer_email as "signerEmail",
        document_type as "documentType",
        status,
        signature_token as "signatureToken",
        token_expires_at as "tokenExpiresAt",
        signed_at as "signedAt",
        created_at as "createdAt"
      FROM signature_requests
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
    `;

        // Serialize BigInts to string to prevent JSON serialization errors
        const formattedSignatures = Array.isArray(signatures) ? signatures.map(sig => ({
            ...sig,
            entityId: typeof sig.entityId === 'bigint' ? sig.entityId.toString() : sig.entityId,
            // Ensure other fields are strings if needed
        })) : [];

        return NextResponse.json({ signatures: formattedSignatures }, { status: 200 });
    } catch (error) {
        console.error('Error fetching signature requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch signature requests' },
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
            console.log('📝 [SIGNATURES] Invalid entity type:', normalizedEntityType);
            return NextResponse.json({ error: `Invalid entity type: ${normalizedEntityType}. Valid types: ${validEntityTypes.join(', ')}` }, { status: 400 });
        }

        if (!validDocumentTypes.includes(normalizedDocType)) {
            console.log('📝 [SIGNATURES] Invalid document type:', normalizedDocType);
            return NextResponse.json({ error: `Invalid document type: ${normalizedDocType}. Valid types: ${validDocumentTypes.join(', ')}` }, { status: 400 });
        }

        // Get document template - try multiple approaches
        console.log('📝 [SIGNATURES] Looking for template:', normalizedEntityType, normalizedDocType);
        
        let templates: any = await prisma.$queryRaw`
            SELECT id, content, name
            FROM document_templates
            WHERE template_type = ${normalizedEntityType}
              AND document_type = ${normalizedDocType}
              AND is_active = true
            ORDER BY version DESC
            LIMIT 1
        `;

        // If no exact match, try to find any active template for this entity type
        if (!templates || templates.length === 0) {
            console.log('📝 [SIGNATURES] No exact template match, trying any template for entity type');
            templates = await prisma.$queryRaw`
                SELECT id, content, name
                FROM document_templates
                WHERE template_type = ${normalizedEntityType}
                  AND is_active = true
                ORDER BY version DESC
                LIMIT 1
            `;
        }

        // If still no match, create a default template content
        let template: any;
        let documentContent: string;
        
        if (!templates || templates.length === 0) {
            console.log('📝 [SIGNATURES] No template found, using default content');
            template = { id: null, content: null };
            documentContent = `
                <h1>${normalizedDocType} Agreement</h1>
                <p>This ${normalizedDocType.toLowerCase()} agreement is between the event organizer and the undersigned party.</p>
                <p>By signing below, you agree to the terms and conditions of this agreement.</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
            `;
        } else {
            template = templates[0];
            documentContent = template.content || `<h1>${normalizedDocType} Agreement</h1><p>Please review and sign this document.</p>`;
        }

        // Generate unique token
        const signatureToken = crypto.randomBytes(32).toString('hex');

        // Set expiration (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const tenantId = (session.user as any)?.currentTenantId;
        const userId = (session.user as any)?.id;

        // Get event details for email
        const events: any = await prisma.$queryRaw`
            SELECT name FROM events WHERE id = ${eventId} LIMIT 1
        `;
        const eventName = events[0]?.name || 'Event';

        // Replace variables in template
        documentContent = documentContent.replace(/{eventName}/g, eventName);
        documentContent = documentContent.replace(/{vendorName}/g, signerName);
        documentContent = documentContent.replace(/{sponsorName}/g, signerName);
        documentContent = documentContent.replace(/{exhibitorName}/g, signerName);
        documentContent = documentContent.replace(/{signerName}/g, signerName);
        documentContent = documentContent.replace(/{date}/g, new Date().toLocaleDateString());

        console.log('📝 [SIGNATURES] Creating signature request in database');

        // Create signature request - handle template.id being null
        if (template.id) {
            await prisma.$executeRaw`
                INSERT INTO signature_requests (
                    event_id,
                    entity_type,
                    entity_id,
                    signer_name,
                    signer_email,
                    document_type,
                    document_template_id,
                    document_content,
                    signature_token,
                    token_expires_at,
                    status,
                    tenant_id,
                    created_by
                ) VALUES (
                    ${eventId},
                    ${normalizedEntityType},
                    ${normalizedEntityId},
                    ${signerName},
                    ${signerEmail},
                    ${normalizedDocType},
                    ${template.id}::uuid,
                    ${documentContent},
                    ${signatureToken},
                    ${expiresAt},
                    'PENDING',
                    ${tenantId},
                    ${userId ? BigInt(userId) : null}
                )
            `;
        } else {
            // Insert without template_id
            await prisma.$executeRaw`
                INSERT INTO signature_requests (
                    event_id,
                    entity_type,
                    entity_id,
                    signer_name,
                    signer_email,
                    document_type,
                    document_content,
                    signature_token,
                    token_expires_at,
                    status,
                    tenant_id,
                    created_by
                ) VALUES (
                    ${eventId},
                    ${normalizedEntityType},
                    ${normalizedEntityId},
                    ${signerName},
                    ${signerEmail},
                    ${normalizedDocType},
                    ${documentContent},
                    ${signatureToken},
                    ${expiresAt},
                    'PENDING',
                    ${tenantId},
                    ${userId ? BigInt(userId) : null}
                )
            `;
        }

        console.log('📝 [SIGNATURES] Signature request created successfully');



        // Send email with signature link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aypheneventplanner.vercel.app';
        const signatureLink = `${baseUrl}/signature/sign/${signatureToken}`;
        console.log(`📧 [SIGNATURES] Signature link: ${signatureLink}`);

        let emailSent = false;
        let emailError: string | null = null;

        // Check if SMTP is configured
        const smtpConfigured = process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD;

        if (smtpConfigured) {
            try {
                await sendMail({
                    to: signerEmail,
                    subject: `Action Required: Please sign ${normalizedDocType} for ${eventName}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                            <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <h1 style="color: #4f46e5; margin: 0; font-size: 24px;">Signature Request</h1>
                                </div>
                                <p style="color: #374151; font-size: 16px;">Hello <strong>${signerName}</strong>,</p>
                                <p style="color: #374151; font-size: 16px;">You have been requested to sign a <strong>${normalizedDocType}</strong> document for the event:</p>
                                <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
                                    <p style="color: #111827; font-size: 18px; font-weight: bold; margin: 0;">${eventName}</p>
                                </div>
                                <p style="color: #374151; font-size: 16px;">Please click the button below to review and sign the document:</p>
                                <div style="text-align: center; margin: 32px 0;">
                                    <a href="${signatureLink}" style="background-color: #4f46e5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Review & Sign Document</a>
                                </div>
                                <p style="color: #6b7280; font-size: 14px;">Or copy this link to your browser:</p>
                                <p style="word-break: break-all;"><a href="${signatureLink}" style="color: #4f46e5; font-size: 14px;">${signatureLink}</a></p>
                                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                                <p style="color: #9ca3af; font-size: 12px; text-align: center;">This link expires in 7 days. If you have any questions, please contact the event organizer.</p>
                            </div>
                        </div>
                    `
                });
                emailSent = true;
                console.log(`✅ [SIGNATURES] Sent signature request email to ${signerEmail}`);
            } catch (err: any) {
                emailError = err.message;
                console.error('❌ [SIGNATURES] Failed to send signature email:', err.message);
            }
        } else {
            emailError = 'SMTP not configured';
            console.log('⚠️ [SIGNATURES] SMTP not configured, email not sent. Link:', signatureLink);
        }

        return NextResponse.json(
            {
                success: true,
                message: emailSent 
                    ? 'Signature request created and email sent successfully' 
                    : 'Signature request created (email not sent - copy link manually)',
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
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
