import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AVAILABLE_CURRENCIES } from '@/lib/currency';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const session = await getServerSession(authOptions as any);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get company currency
        const company: any[] = await prisma.$queryRawUnsafe(`
            SELECT currency FROM tenants WHERE id = $1
        `, params.id);

        if (company.length === 0) {
            return NextResponse.json({ message: 'Company not found' }, { status: 404 });
        }

        return NextResponse.json({
            currency: company[0].currency || 'USD',
            availableCurrencies: AVAILABLE_CURRENCIES.map(c => ({
                code: c.code,
                name: c.name,
                symbol: c.symbol
            }))
        });
    } catch (error: any) {
        console.error('Error fetching company currency:', error);
        return NextResponse.json({ message: 'Failed to fetch currency' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    const session = await getServerSession(authOptions as any);

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { currency } = body;

        // Validate currency
        const validCurrency = AVAILABLE_CURRENCIES.find(c => c.code === currency);
        if (!validCurrency) {
            return NextResponse.json({
                message: 'Invalid currency code',
                validCurrencies: AVAILABLE_CURRENCIES.map(c => c.code)
            }, { status: 400 });
        }

        // Update company currency
        await prisma.$executeRawUnsafe(`
            UPDATE tenants 
            SET currency = $1, updated_at = NOW()
            WHERE id = $2
        `, currency, params.id);

        console.log(`Updated company ${params.id} currency to ${currency}`);

        return NextResponse.json({
            success: true,
            currency,
            message: `Currency updated to ${currency}`
        });
    } catch (error: any) {
        console.error('Error updating company currency:', error);
        return NextResponse.json({
            message: 'Failed to update currency',
            details: error.message
        }, { status: 500 });
    }
}
