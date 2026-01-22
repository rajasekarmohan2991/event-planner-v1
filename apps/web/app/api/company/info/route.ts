import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/company/info - Get current company information including logo
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = (session.user as any)?.tenantId || (session.user as any)?.currentTenantId;

        if (!tenantId) {
            return NextResponse.json({ error: 'No company context' }, { status: 400 });
        }

        // Fetch company information including provider module settings
        const company = await prisma.$queryRaw<any[]>`
            SELECT 
                id,
                name,
                slug,
                logo,
                subdomain,
                subscription_plan as plan,
                status,
                billing_email as "billingEmail",
                currency,
                country,
                timezone,
                module_vendor_management,
                module_sponsor_management,
                module_exhibitor_management,
                provider_commission_rate,
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM tenants
            WHERE id = ${tenantId}
        `;

        if (!company || company.length === 0) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json(company[0], { status: 200 });
    } catch (error) {
        console.error('Error fetching company info:', error);
        return NextResponse.json(
            { error: 'Failed to fetch company information' },
            { status: 500 }
        );
    }
}

// PUT /api/company/info - Update company information including logo
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenantId = (session.user as any)?.tenantId || (session.user as any)?.currentTenantId;

        if (!tenantId) {
            return NextResponse.json({ error: 'No company context' }, { status: 400 });
        }

        const body = await request.json();
        const { logo, name, billingEmail, currency, country, timezone } = body;

        // Update company information
        const updatedCompany = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                ...(logo !== undefined && { logo }),
                ...(name && { name }),
                ...(billingEmail && { billingEmail }),
                ...(currency && { currency }),
                ...(country && { country }),
                ...(timezone && { timezone }),
                updatedAt: new Date()
            },
            select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                subdomain: true,
                plan: true,
                status: true,
                billingEmail: true,
                currency: true,
                country: true,
                timezone: true,
                updatedAt: true
            }
        });

        return NextResponse.json({ company: updatedCompany }, { status: 200 });
    } catch (error) {
        console.error('Error updating company info:', error);
        return NextResponse.json(
            { error: 'Failed to update company information' },
            { status: 500 }
        );
    }
}
