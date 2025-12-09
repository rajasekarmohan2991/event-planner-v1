// Currency configuration and utilities

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  position: 'before' | 'after'; // Symbol position relative to amount
}

export const AVAILABLE_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', position: 'before' },
  { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
  { code: 'GBP', symbol: '£', name: 'British Pound', position: 'before' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', position: 'before' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', position: 'before' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', position: 'before' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', position: 'before' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', position: 'before' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', position: 'before' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', position: 'before' },
];

export const DEFAULT_CURRENCY: Currency = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar',
  position: 'before'
};

export function getCurrencyByCode(code: string): Currency {
  return AVAILABLE_CURRENCIES.find(c => c.code === code) || DEFAULT_CURRENCY;
}

export function formatCurrency(amount: number, currency: Currency): string {
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  if (currency.position === 'before') {
    return `${currency.symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount}${currency.symbol}`;
  }
}

export function formatPrice(amount: number, currencyCode?: string): string {
  const currency = currencyCode ? getCurrencyByCode(currencyCode) : DEFAULT_CURRENCY;
  return formatCurrency(amount, currency);
}

// Approximate exchange rates relative to USD (Base)
const EXCHANGE_RATES: Record<string, number> = {
  'USD': 1,
  'EUR': 0.92,
  'GBP': 0.79,
  'INR': 83.5,
  'JPY': 155,
  'CAD': 1.36,
  'AUD': 1.51,
  'SGD': 1.35,
  'CNY': 7.23,
  'KRW': 1370,
};

export function convertPrice(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;
  
  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate;
  const convertedAmount = amountInUSD * toRate;
  
  // Round nicely
  if (convertedAmount > 1000) {
    return Math.round(convertedAmount / 100) * 100; // Round to nearest 100 for large numbers
  } else if (convertedAmount > 100) {
    return Math.round(convertedAmount / 10) * 10; // Round to nearest 10
  } else {
    return Math.round(convertedAmount);
  }
}

// Get currency from company settings or default
export async function getCompanyCurrency(companyId?: string): Promise<Currency> {
  if (!companyId) return DEFAULT_CURRENCY;
  
  try {
    // This would fetch from company settings in a real implementation
    // For now, return default
    return DEFAULT_CURRENCY;
  } catch (error) {
    console.error('Error fetching company currency:', error);
    return DEFAULT_CURRENCY;
  }
}

// Super admin can set global default currency
export function getGlobalDefaultCurrency(): Currency {
  // This could be stored in system settings
  return DEFAULT_CURRENCY;
}
