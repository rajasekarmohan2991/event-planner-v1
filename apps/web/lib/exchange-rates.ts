import prisma from '@/lib/prisma'

const OPEN_EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

interface ExchangeRateResponse {
    provider: string;
    WARNING_UPGRADE_TO_V6: string;
    terms: string;
    base: string;
    date: string;
    time_last_updated: number;
    rates: Record<string, number>;
}

export async function updateExchangeRates() {
    try {
        const response = await fetch(OPEN_EXCHANGE_API_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
        }

        const data: ExchangeRateResponse = await response.json();
        const baseCurrency = data.base;
        const rates = data.rates;

        // We keep USD as base. 
        // If we want cross rates, we can calculate them, but usually storing base USD is enough 
        // and we convert A -> B by A -> USD -> B.

        // Store rates in DB
        const upsertOperations = Object.entries(rates).map(([currency, rate]) => {
            return prisma.exchangeRate.upsert({
                where: {
                    fromCurrency_toCurrency: {
                        fromCurrency: baseCurrency,
                        toCurrency: currency,
                    },
                },
                update: {
                    rate: Number(rate),
                    lastUpdated: new Date(),
                },
                create: {
                    fromCurrency: baseCurrency,
                    toCurrency: currency,
                    rate: Number(rate),
                },
            });
        });

        await prisma.$transaction(upsertOperations);
        console.log(`✅ Updated ${upsertOperations.length} exchange rates from ${baseCurrency}`);

        return true;
    } catch (error) {
        console.error('❌ Error updating exchange rates:', error);
        return false;
    }
}

export async function getExchangeRate(from: string, to: string): Promise<number | null> {
    if (from === to) return 1;

    // Try direct rate
    const direct = await prisma.exchangeRate.findUnique({
        where: {
            fromCurrency_toCurrency: {
                fromCurrency: from,
                toCurrency: to,
            },
        },
    });

    if (direct) return direct.rate;

    // Try via USD (assuming USD is the common base)
    // Rate = (USD -> To) / (USD -> From)
    // Because if 1 USD = X From, and 1 USD = Y To.
    // Then 1 From = (1/X) USD.
    // And (1/X) USD = (1/X) * Y To = Y/X To.

    const [usdToFrom, usdToTo] = await Promise.all([
        prisma.exchangeRate.findUnique({
            where: { fromCurrency_toCurrency: { fromCurrency: 'USD', toCurrency: from } },
        }),
        prisma.exchangeRate.findUnique({
            where: { fromCurrency_toCurrency: { fromCurrency: 'USD', toCurrency: to } },
        })
    ]);

    if (usdToFrom && usdToTo) {
        return usdToTo.rate / usdToFrom.rate;
    }

    // Fallback to hardcoded if critical? Or return null.
    return null;
}

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
    const rate = await getExchangeRate(from, to);
    if (rate === null) {
        // Fallback to caching/hardcoded from cached file if needed or throw
        // For now, let's just use 1 as fallback or log warning
        console.warn(`No exchange rate found for ${from} -> ${to}`);
        return amount;
    }
    return amount * rate;
}
