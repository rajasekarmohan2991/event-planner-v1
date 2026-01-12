import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma'; // Fixed import

export const dynamic = 'force-dynamic'

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions as any);

        // Check if user is super admin
        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized - Super Admin access required' },
                { status: 403 }
            );
        }

        const params = 'then' in context.params ? await context.params : context.params;
        const { id: companyId } = params;
        const { currency } = await request.json();

        // Validate currency code - Expanded list to match frontend
        const validCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'SGD', 'CNY', 'AED'];

        // Allow updating if it's in the list
        if (!validCurrencies.includes(currency)) {
            return NextResponse.json(
                { error: `Invalid currency code. Supported: ${validCurrencies.join(', ')}` },
                { status: 400 }
            );
        }

        // Update tenant currency using raw SQL
        await prisma.$executeRaw`
            UPDATE tenants 
            SET currency = ${currency}, updated_at = NOW()
            WHERE id = ${companyId}
        `;

        // Fetch updated tenant
        const updatedTenant = await prisma.$queryRaw<any[]>`
            SELECT id, name, currency
            FROM tenants
            WHERE id = ${companyId}
            LIMIT 1
        `;

        if (!updatedTenant || updatedTenant.length === 0) {
            return NextResponse.json(
                { error: 'Company not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            tenant: {
                id: updatedTenant[0].id,
                name: updatedTenant[0].name,
                currency: updatedTenant[0].currency,
            },
        });
    } catch (error: any) {
        console.error('Error updating company currency:', error);
        return NextResponse.json(
            { error: 'Failed to update company currency: ' + error.message },
            { status: 500 }
        );
    }
}
