// Open Exchange Rates API Integration
// Free tier: 1000 requests/month, updates once per hour

const OPEN_EXCHANGE_RATES_APP_ID = process.env.OPEN_EXCHANGE_RATES_API_KEY || 'YOUR_APP_ID_HERE';
const BASE_URL = 'https://openexchangerates.org/api';

export interface ExchangeRates {
    base: string;
    rates: Record<string, number>;
    timestamp: number;
}

let cachedRates: ExchangeRates | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Fetch latest exchange rates from Open Exchange Rates API
 * Caches results for 1 hour to stay within free tier limits
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
    const now = Date.now();

    // Return cached rates if still fresh
    if (cachedRates && (now - lastFetch) < CACHE_DURATION) {
        console.log('Using cached exchange rates');
        return cachedRates;
    }

    try {
        console.log('Fetching fresh exchange rates from Open Exchange Rates API');
        const response = await fetch(
            `${BASE_URL}/latest.json?app_id=${OPEN_EXCHANGE_RATES_APP_ID}`,
            { next: { revalidate: 3600 } } // Cache for 1 hour
        );

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        cachedRates = {
            base: data.base,
            rates: data.rates,
            timestamp: data.timestamp * 1000 // Convert to milliseconds
        };

        lastFetch = now;

        console.log(`Exchange rates updated. Base: ${data.base}, Currencies: ${Object.keys(data.rates).length}`);
        return cachedRates;
    } catch (error) {
        console.error('Failed to fetch exchange rates:', error);

        // Return cached rates if available, even if stale
        if (cachedRates) {
            console.warn('Using stale cached rates due to API error');
            return cachedRates;
        }

        // Fallback to hardcoded rates if API fails and no cache
        console.warn('Using fallback hardcoded rates');
        return getFallbackRates();
    }
}

/**
 * Convert amount from one currency to another using live rates
 */
export async function convertCurrencyLive(
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const rates = await fetchExchangeRates();

    // All rates are relative to USD
    const fromRate = rates.rates[fromCurrency] || 1;
    const toRate = rates.rates[toCurrency] || 1;

    // Convert to USD first, then to target currency
    const amountInUSD = amount / fromRate;
    const convertedAmount = amountInUSD * toRate;

    return Math.round(convertedAmount * 100) / 100;
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(
    fromCurrency: string,
    toCurrency: string
): Promise<number> {
    if (fromCurrency === toCurrency) return 1;

    const rates = await fetchExchangeRates();

    const fromRate = rates.rates[fromCurrency] || 1;
    const toRate = rates.rates[toCurrency] || 1;

    return toRate / fromRate;
}

/**
 * Fallback rates if API is unavailable
 */
function getFallbackRates(): ExchangeRates {
    return {
        base: 'USD',
        rates: {
            USD: 1.0,
            EUR: 0.92,
            GBP: 0.79,
            AUD: 1.52,
            CAD: 1.36,
            INR: 83.5,
            JPY: 155.0,
            SGD: 1.35,
            AED: 3.67,
            NZD: 1.65,
            CNY: 7.24,
            HKD: 7.83,
            CHF: 0.88,
            SEK: 10.45,
            NOK: 10.75
        },
        timestamp: Date.now()
    };
}

/**
 * Get all available currencies from latest rates
 */
export async function getAvailableCurrencies(): Promise<string[]> {
    const rates = await fetchExchangeRates();
    return Object.keys(rates.rates).sort();
}

/**
 * Format currency with proper symbol and conversion info
 */
export function formatCurrencyWithConversion(
    amount: number,
    originalCurrency: string,
    displayCurrency: string,
    rate: number
): string {
    if (originalCurrency === displayCurrency) {
        return `${displayCurrency} ${amount.toFixed(2)}`;
    }

    const convertedAmount = amount * rate;
    return `${displayCurrency} ${convertedAmount.toFixed(2)} (${originalCurrency} ${amount.toFixed(2)} @ ${rate.toFixed(4)})`;
}
