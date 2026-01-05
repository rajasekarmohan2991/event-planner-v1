import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic'

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is super admin
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized - Super Admin access required' },
                { status: 403 }
            );
        }

        const { currency } = await request.json();
        const companyId = params.id;

        // Validate currency code
        const validCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'SGD', 'CNY'];
        if (!validCurrencies.includes(currency)) {
            return NextResponse.json(
                { error: 'Invalid currency code' },
                { status: 400 }
            );
        }

        // Update tenant currency
        const updatedTenant = await prisma.tenant.update({
            where: { id: companyId },
            data: { currency },
        });

        return NextResponse.json({
            success: true,
            tenant: {
                id: updatedTenant.id,
                name: updatedTenant.name,
                currency: updatedTenant.currency,
            },
        });
    } catch (error) {
        console.error('Error updating company currency:', error);
        return NextResponse.json(
            { error: 'Failed to update company currency' },
            { status: 500 }
        );
    }
}
