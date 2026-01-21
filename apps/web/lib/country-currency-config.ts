// Country and Currency Configuration for Tax Structures
// Comprehensive mapping of countries, currencies, and default tax rates

export interface CountryConfig {
    code: string; // ISO 3166-1 alpha-2
    name: string;
    currency: string; // ISO 4217
    currencySymbol: string;
    defaultTaxRate: number;
    defaultTaxName: string;
    taxType: 'VAT' | 'GST' | 'SALES_TAX' | 'OTHER';
    flag: string;
}

export const COUNTRY_CURRENCY_MAP: Record<string, CountryConfig> = {
    US: {
        code: 'US',
        name: 'United States',
        currency: 'USD',
        currencySymbol: '$',
        defaultTaxRate: 7.5,
        defaultTaxName: 'Sales Tax',
        taxType: 'SALES_TAX',
        flag: '🇺🇸'
    },
    AU: {
        code: 'AU',
        name: 'Australia',
        currency: 'AUD',
        currencySymbol: 'A$',
        defaultTaxRate: 10.0,
        defaultTaxName: 'GST',
        taxType: 'GST',
        flag: '🇦🇺'
    },
    IN: {
        code: 'IN',
        name: 'India',
        currency: 'INR',
        currencySymbol: '₹',
        defaultTaxRate: 18.0,
        defaultTaxName: 'GST (18%)',
        taxType: 'GST',
        flag: '🇮🇳'
    },
    GB: {
        code: 'GB',
        name: 'United Kingdom',
        currency: 'GBP',
        currencySymbol: '£',
        defaultTaxRate: 20.0,
        defaultTaxName: 'VAT',
        taxType: 'VAT',
        flag: '🇬🇧'
    },
    CA: {
        code: 'CA',
        name: 'Canada',
        currency: 'CAD',
        currencySymbol: 'C$',
        defaultTaxRate: 13.0,
        defaultTaxName: 'HST',
        taxType: 'GST',
        flag: '🇨🇦'
    },
    DE: {
        code: 'DE',
        name: 'Germany',
        currency: 'EUR',
        currencySymbol: '€',
        defaultTaxRate: 19.0,
        defaultTaxName: 'VAT',
        taxType: 'VAT',
        flag: '🇩🇪'
    },
    FR: {
        code: 'FR',
        name: 'France',
        currency: 'EUR',
        currencySymbol: '€',
        defaultTaxRate: 20.0,
        defaultTaxName: 'VAT',
        taxType: 'VAT',
        flag: '🇫🇷'
    },
    SG: {
        code: 'SG',
        name: 'Singapore',
        currency: 'SGD',
        currencySymbol: 'S$',
        defaultTaxRate: 8.0,
        defaultTaxName: 'GST',
        taxType: 'GST',
        flag: '🇸🇬'
    },
    AE: {
        code: 'AE',
        name: 'United Arab Emirates',
        currency: 'AED',
        currencySymbol: 'د.إ',
        defaultTaxRate: 5.0,
        defaultTaxName: 'VAT',
        taxType: 'VAT',
        flag: '🇦🇪'
    },
    JP: {
        code: 'JP',
        name: 'Japan',
        currency: 'JPY',
        currencySymbol: '¥',
        defaultTaxRate: 10.0,
        defaultTaxName: 'Consumption Tax',
        taxType: 'OTHER',
        flag: '🇯🇵'
    },
    NZ: {
        code: 'NZ',
        name: 'New Zealand',
        currency: 'NZD',
        currencySymbol: 'NZ$',
        defaultTaxRate: 15.0,
        defaultTaxName: 'GST',
        taxType: 'GST',
        flag: '🇳🇿'
    }
};

// Get country config by currency code
export function getCountryByCurrency(currencyCode: string): CountryConfig | null {
    const entry = Object.values(COUNTRY_CURRENCY_MAP).find(c => c.currency === currencyCode);
    return entry || null;
}

// Get country config by country code
export function getCountryByCode(countryCode: string): CountryConfig | null {
    return COUNTRY_CURRENCY_MAP[countryCode] || null;
}

// Get all countries that use a specific currency
export function getCountriesByCurrency(currencyCode: string): CountryConfig[] {
    return Object.values(COUNTRY_CURRENCY_MAP).filter(c => c.currency === currencyCode);
}

// Get applicable tax structures for a company based on their currency
export function getApplicableCountries(companyCurrency: string, companyCountry?: string): CountryConfig[] {
    const countries: CountryConfig[] = [];

    // Always include company's own country if specified
    if (companyCountry && COUNTRY_CURRENCY_MAP[companyCountry]) {
        countries.push(COUNTRY_CURRENCY_MAP[companyCountry]);
    }

    // Include all countries with the same currency
    const sameCurrencyCountries = getCountriesByCurrency(companyCurrency);
    sameCurrencyCountries.forEach(country => {
        if (!countries.find(c => c.code === country.code)) {
            countries.push(country);
        }
    });

    return countries;
}

// Currency conversion rates (relative to USD)
export const EXCHANGE_RATES: Record<string, number> = {
    USD: 1.0,
    AUD: 1.52,
    INR: 83.5,
    GBP: 0.79,
    CAD: 1.36,
    EUR: 0.92,
    SGD: 1.35,
    AED: 3.67,
    JPY: 155.0,
    NZD: 1.65
};

// Convert amount from one currency to another
export function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
): number {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = EXCHANGE_RATES[toCurrency] || 1;

    // Convert to USD first, then to target currency
    const amountInUSD = amount / fromRate;
    const convertedAmount = amountInUSD * toRate;

    // Round to 2 decimal places
    return Math.round(convertedAmount * 100) / 100;
}

// Format currency with proper symbol
export function formatCurrencyAmount(
    amount: number,
    currencyCode: string
): string {
    const country = Object.values(COUNTRY_CURRENCY_MAP).find(c => c.currency === currencyCode);
    const symbol = country?.currencySymbol || currencyCode;

    return `${symbol}${amount.toFixed(2)}`;
}
