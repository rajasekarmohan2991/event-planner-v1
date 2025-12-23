import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateExchangeRates } from '@/lib/exchange-rates'
import { ensureSchema } from '@/lib/ensure-schema'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        // Return all rates based on USD
        let rates = await prisma.exchangeRate.findMany({
            where: { fromCurrency: 'USD' },
            select: { toCurrency: true, rate: true }
        });

        // If no rates exist, fetch them automatically (lazy initialization)
        if (rates.length === 0) {
            console.log('💱 No exchange rates found, fetching from external API...')
            const success = await updateExchangeRates()
            if (success) {
                rates = await prisma.exchangeRate.findMany({
                    where: { fromCurrency: 'USD' },
                    select: { toCurrency: true, rate: true }
                })
            }
        }

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
    } catch (error: any) {
        console.error('Error fetching exchange rates:', error)

        // Auto-heal if table is missing
        if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
            console.log('🩹 Self-repairing schema for Exchange Rates...')
            await ensureSchema()
            return NextResponse.json({ error: 'Schema updated. Please retry request.' }, { status: 503 })
        }

        return NextResponse.json({ error: 'Failed to fetch rates', details: error.message }, { status: 500 });
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
