import prisma from '@/lib/prisma'

// Free APIs for exchange rates (no API key required)
const PRIMARY_API = 'https://api.exchangerate.host/latest?base=USD'
const FALLBACK_API = 'https://api.exchangerate-api.com/v4/latest/USD'

interface ExchangeRateResponse {
    base: string
    date?: string
    rates: Record<string, number>
    success?: boolean
    // For exchangerate-api.com
    provider?: string
    time_last_updated?: number
}

export async function updateExchangeRates() {
    try {
        console.log('💱 Fetching exchange rates from API...')

        // Try primary API first
        let response = await fetch(PRIMARY_API, {
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store'
        })

        let data: ExchangeRateResponse | null = null

        if (response.ok) {
            data = await response.json()
            console.log('✅ Fetched rates from primary API (exchangerate.host)')
        } else {
            console.warn('⚠️ Primary API failed, trying fallback...')
            // Try fallback API
            response = await fetch(FALLBACK_API, {
                headers: {
                    'Accept': 'application/json',
                },
                cache: 'no-store'
            })

            if (response.ok) {
                data = await response.json()
                console.log('✅ Fetched rates from fallback API (exchangerate-api.com)')
            } else {
                throw new Error(`Both APIs failed: ${response.statusText}`)
            }
        }

        if (!data || !data.rates) {
            throw new Error('Invalid response from exchange rate API')
        }

        const baseCurrency = data.base || 'USD'
        const rates = data.rates

        console.log(`💱 Processing ${Object.keys(rates).length} exchange rates...`)

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
            })
        })

        await prisma.$transaction(upsertOperations)
        console.log(`✅ Updated ${upsertOperations.length} exchange rates from ${baseCurrency}`)

        // Log some sample rates for verification
        console.log('💱 Sample rates:', {
            EUR: rates.EUR,
            GBP: rates.GBP,
            INR: rates.INR,
            JPY: rates.JPY
        })

        return true
    } catch (error) {
        console.error('❌ Error updating exchange rates:', error)
        return false
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
