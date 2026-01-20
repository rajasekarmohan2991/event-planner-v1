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

        const eventId = BigInt(params.id);
        const body = await request.json();
        const { entityType, entityId, signerName, signerEmail, documentType } = body;

        // Validation
        if (!entityType || !entityId || !signerName || !signerEmail || !documentType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const validEntityTypes = ['VENDOR', 'SPONSOR', 'EXHIBITOR'];
        const validDocumentTypes = ['TERMS', 'DISCLAIMER', 'CONTRACT'];

        if (!validEntityTypes.includes(entityType)) {
            return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
        }

        if (!validDocumentTypes.includes(documentType)) {
            return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
        }

        // Get document template
        const templates: any = await prisma.$queryRaw`
      SELECT id, content
      FROM document_templates
      WHERE template_type = ${entityType}
        AND document_type = ${documentType}
        AND is_active = true
      ORDER BY version DESC
      LIMIT 1
    `;

        if (!templates || templates.length === 0) {
            return NextResponse.json(
                { error: 'No active template found for this entity type' },
                { status: 404 }
            );
        }

        const template = templates[0];

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
        let documentContent = template.content;
        documentContent = documentContent.replace(/{eventName}/g, eventName);
        documentContent = documentContent.replace(/{vendorName}/g, signerName);
        documentContent = documentContent.replace(/{sponsorName}/g, signerName);
        documentContent = documentContent.replace(/{exhibitorName}/g, signerName);

        // Create signature request
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
        ${entityType},
        ${entityId},
        ${signerName},
        ${signerEmail},
        ${documentType},
        ${template.id}::uuid,
        ${documentContent},
        ${signatureToken},
        ${expiresAt},
        'PENDING',
        ${tenantId},
        ${userId ? BigInt(userId) : null}
      )
    `;



        // Send email with signature link
        const signatureLink = `${process.env.NEXT_PUBLIC_APP_URL}/sign/${signatureToken}`;
        console.log(`📧 Signature link: ${signatureLink}`);

        try {
            await sendMail({
                to: signerEmail,
                subject: `Action Required: Please sign ${documentType} for ${eventName}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #4f46e5;">Signature Request</h2>
                        <p>Hello ${signerName},</p>
                        <p>You have been requested to sign <strong>${documentType}</strong> for the event <strong>${eventName}</strong>.</p>
                        <p>Please click the button below to review and sign the document:</p>
                        <div style="margin: 30px 0;">
                            <a href="${signatureLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review and Sign</a>
                        </div>
                        <p>Or copy this link to your browser:</p>
                        <p><a href="${signatureLink}" style="color: #4f46e5;">${signatureLink}</a></p>
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                        <p style="color: #6b7280; font-size: 14px;">This link expires in 7 days.</p>
                    </div>
                `
            });
            console.log(`✅ Sent signature request email to ${signerEmail}`);
        } catch (emailError) {
            console.error('❌ Failed to send signature email:', emailError);
            // We don't block the response, but we log the error
        }

        return NextResponse.json(
            {
                message: 'Signature request created successfully',
                signatureLink
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating signature request:', error);
        return NextResponse.json(
            { error: 'Failed to create signature request' },
            { status: 500 }
        );
    }
}
