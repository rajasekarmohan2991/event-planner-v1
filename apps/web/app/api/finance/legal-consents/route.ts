import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// GET /api/finance/legal-consents - List legal consents
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
        const entityType = searchParams.get('entityType');
        const entityId = searchParams.get('entityId');

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

        if (entityType) {
            whereClause += ` AND entity_type = $${paramIndex}`;
            params.push(entityType);
            paramIndex++;
        }

        if (entityId) {
            whereClause += ` AND entity_id = $${paramIndex}`;
            params.push(entityId);
            paramIndex++;
        }

        const consents = await prisma.$queryRawUnsafe(`
            SELECT 
                id,
                tenant_id as "tenantId",
                event_id as "eventId",
                user_id as "userId",
                entity_type as "entityType",
                entity_id as "entityId",
                entity_email as "entityEmail",
                entity_name as "entityName",
                document_type as "documentType",
                document_version as "documentVersion",
                document_hash as "documentHash",
                document_url as "documentUrl",
                consent_method as "consentMethod",
                typed_name as "typedName",
                signature_url as "signatureUrl",
                otp_verified as "otpVerified",
                ip_address as "ipAddress",
                consent_given_at as "consentGivenAt",
                is_revoked as "isRevoked",
                revoked_at as "revokedAt",
                created_at as "createdAt"
            FROM legal_consents
            ${whereClause}
            ORDER BY consent_given_at DESC
            LIMIT 100
        `, ...params);

        return NextResponse.json({ consents });
    } catch (error: any) {
        console.error('Error fetching legal consents:', error);
        
        if (error.message?.includes('does not exist')) {
            return NextResponse.json({ consents: [] });
        }
        
        return NextResponse.json({ 
            error: 'Failed to fetch legal consents',
            details: error.message 
        }, { status: 500 });
    }
}

// POST /api/finance/legal-consents - Record legal consent
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    
    try {
        const body = await req.json();
        const {
            tenantId,
            eventId,
            userId,
            entityType,
            entityId,
            entityEmail,
            entityName,
            documentType,
            documentVersion,
            documentContent, // Optional: for hashing
            documentUrl,
            consentMethod,
            typedName,
            signatureUrl,
            otpVerified = false
        } = body;

        // Get tenant from session if not provided
        const user = session?.user as any;
        const finalTenantId = tenantId || user?.currentTenantId;

        // Validate required fields
        if (!entityEmail || !entityName || !documentType || !documentVersion || !consentMethod) {
            return NextResponse.json({ 
                error: 'Missing required fields',
                details: 'entityEmail, entityName, documentType, documentVersion, and consentMethod are required'
            }, { status: 400 });
        }

        // Validate consent method
        const validMethods = ['CHECKBOX', 'TYPED_NAME', 'OTP', 'DIGITAL_SIGNATURE'];
        if (!validMethods.includes(consentMethod)) {
            return NextResponse.json({ 
                error: 'Invalid consent method',
                validMethods
            }, { status: 400 });
        }

        // If typed name consent, require typed name
        if (consentMethod === 'TYPED_NAME' && !typedName) {
            return NextResponse.json({ 
                error: 'Typed name required for TYPED_NAME consent method'
            }, { status: 400 });
        }

        // Generate document hash if content provided
        let documentHash = null;
        if (documentContent) {
            documentHash = crypto.createHash('sha256').update(documentContent).digest('hex');
        }

        // Get IP and User Agent from request
        const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                         req.headers.get('x-real-ip') || 
                         'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        const id = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await prisma.$executeRawUnsafe(`
            INSERT INTO legal_consents (
                id, tenant_id, event_id, user_id,
                entity_type, entity_id, entity_email, entity_name,
                document_type, document_version, document_hash, document_url,
                consent_method, typed_name, signature_url, otp_verified,
                ip_address, user_agent, consent_given_at,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW(), NOW()
            )
        `,
            id,
            finalTenantId,
            eventId ? BigInt(eventId) : null,
            userId ? BigInt(userId) : null,
            entityType || null,
            entityId || null,
            entityEmail,
            entityName,
            documentType,
            documentVersion,
            documentHash,
            documentUrl || null,
            consentMethod,
            typedName || null,
            signatureUrl || null,
            otpVerified,
            ipAddress,
            userAgent
        );

        return NextResponse.json({
            success: true,
            consent: {
                id,
                entityEmail,
                entityName,
                documentType,
                documentVersion,
                consentMethod,
                consentGivenAt: new Date()
            }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error recording legal consent:', error);
        return NextResponse.json({ 
            error: 'Failed to record legal consent',
            details: error.message 
        }, { status: 500 });
    }
}
