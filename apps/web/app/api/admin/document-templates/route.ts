import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ensureSchema } from '@/lib/ensure-schema';

// GET /api/admin/document-templates - List all templates
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const templateType = searchParams.get('type'); // VENDOR, SPONSOR, EXHIBITOR
        const isActive = searchParams.get('active');

        const templates = await prisma.$queryRaw`
      SELECT 
        id,
        template_type as "templateType",
        document_name as "documentName",
        document_type as "documentType",
        content,
        version,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM document_templates
      WHERE 
        (${templateType}::text IS NULL OR template_type = ${templateType})
        AND (${isActive}::text IS NULL OR is_active = ${isActive === 'true'})
      ORDER BY template_type, document_type, created_at DESC
    `;

        return NextResponse.json({ templates }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching document templates:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        // If table doesn't exist, trigger schema healing
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
            console.log('🔧 Document templates table missing, triggering schema healing...');
            try {
                await ensureSchema();
                return NextResponse.json(
                    { error: 'Schema updated. Please retry your request.' },
                    { status: 503 }
                );
            } catch (healError) {
                console.error('Schema healing failed:', healError);
            }
        }

        return NextResponse.json(
            { 
                error: 'Failed to fetch document templates',
                details: error.message 
            },
            { status: 500 }
        );
    }
}

// POST /api/admin/document-templates - Create new template
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const userRole = (session.user as any)?.role;
        if (userRole !== 'SUPER_ADMIN' && userRole !== 'TENANT_ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { templateType, documentName, documentType, content } = body;

        // Validation
        if (!templateType || !documentName || !documentType || !content) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const validTemplateTypes = ['VENDOR', 'SPONSOR', 'EXHIBITOR'];
        const validDocumentTypes = ['TERMS', 'DISCLAIMER', 'CONTRACT'];

        if (!validTemplateTypes.includes(templateType)) {
            return NextResponse.json(
                { error: 'Invalid template type' },
                { status: 400 }
            );
        }

        if (!validDocumentTypes.includes(documentType)) {
            return NextResponse.json(
                { error: 'Invalid document type' },
                { status: 400 }
            );
        }

        const tenantId = (session.user as any)?.currentTenantId;
        const userId = (session.user as any)?.id;

        if (!tenantId) {
            return NextResponse.json(
                { error: 'Tenant ID not found in session' },
                { status: 400 }
            );
        }

        // Create template
        const result: any = await prisma.$queryRaw`
      INSERT INTO document_templates (
        template_type,
        document_name,
        document_type,
        content,
        tenant_id,
        created_by,
        version,
        is_active
      ) VALUES (
        ${templateType},
        ${documentName},
        ${documentType},
        ${content},
        ${tenantId},
        ${userId ? BigInt(userId) : null},
        1,
        true
      )
      RETURNING id, template_type as "templateType", document_name as "documentName"
    `;

        return NextResponse.json(
            { 
                message: 'Template created successfully',
                template: result[0]
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating document template:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        // If table doesn't exist, trigger schema healing
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
            console.log('🔧 Document templates table missing, triggering schema healing...');
            try {
                await ensureSchema();
                return NextResponse.json(
                    { error: 'Schema updated. Please retry creating the template.' },
                    { status: 503 }
                );
            } catch (healError) {
                console.error('Schema healing failed:', healError);
            }
        }

        return NextResponse.json(
            { 
                error: 'Failed to create document template',
                details: error.message 
            },
            { status: 500 }
        );
    }
}
