import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateExchangeRates } from '@/lib/exchange-rates'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        // Return all rates based on USD
        const rates = await prisma.exchangeRate.findMany({
            where: { fromCurrency: 'USD' },
            select: { toCurrency: true, rate: true }
        });

        // Convert to map format expected by frontend
        const ratesMap: Record<string, number> = {};
        ratesMap['USD'] = 1;
        rates.forEach(r => {
            ratesMap[r.toCurrency] = r.rate;
        });

        return NextResponse.json({
            base: 'USD',
            rates: ratesMap,
            lastUpdated: rates.length > 0 ? new Date() : null
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any
        if (session?.user?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const success = await updateExchangeRates();

        if (success) {
            return NextResponse.json({ message: 'Rates updated successfully' });
        } else {
            return NextResponse.json({ error: 'Failed to update rates' }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
