// Country-based tax rate templates
// This file contains predefined tax structures for different countries

export interface TaxTemplate {
  name: string;
  rate: number;
  description: string;
  isDefault: boolean;
}

export const TAX_TEMPLATES: Record<string, TaxTemplate[]> = {
  // United States
  US: [
    { name: 'Sales Tax', rate: 7.5, description: 'Average US state sales tax', isDefault: true },
    { name: 'No Tax', rate: 0, description: 'Tax-exempt transactions', isDefault: false },
  ],
  
  // India
  IN: [
    { name: 'GST 18%', rate: 18, description: 'Standard GST rate for services', isDefault: true },
    { name: 'GST 12%', rate: 12, description: 'Reduced GST rate', isDefault: false },
    { name: 'GST 5%', rate: 5, description: 'Lower GST rate', isDefault: false },
    { name: 'GST 0%', rate: 0, description: 'Zero-rated or exempt', isDefault: false },
  ],
  
  // United Kingdom
  GB: [
    { name: 'VAT 20%', rate: 20, description: 'Standard VAT rate', isDefault: true },
    { name: 'VAT 5%', rate: 5, description: 'Reduced VAT rate', isDefault: false },
    { name: 'VAT 0%', rate: 0, description: 'Zero-rated goods and services', isDefault: false },
  ],
  
  // Canada
  CA: [
    { name: 'GST 5%', rate: 5, description: 'Federal Goods and Services Tax', isDefault: true },
    { name: 'HST 13%', rate: 13, description: 'Harmonized Sales Tax (Ontario)', isDefault: false },
    { name: 'HST 15%', rate: 15, description: 'Harmonized Sales Tax (Atlantic)', isDefault: false },
    { name: 'No Tax', rate: 0, description: 'Tax-exempt', isDefault: false },
  ],
  
  // Australia
  AU: [
    { name: 'GST 10%', rate: 10, description: 'Goods and Services Tax', isDefault: true },
    { name: 'GST-Free', rate: 0, description: 'GST-free goods and services', isDefault: false },
  ],
  
  // European Union (General)
  EU: [
    { name: 'VAT 20%', rate: 20, description: 'Standard EU VAT rate', isDefault: true },
    { name: 'VAT 10%', rate: 10, description: 'Reduced VAT rate', isDefault: false },
    { name: 'VAT 5%', rate: 5, description: 'Super-reduced VAT rate', isDefault: false },
    { name: 'VAT 0%', rate: 0, description: 'Zero-rated', isDefault: false },
  ],
  
  // Germany
  DE: [
    { name: 'MwSt 19%', rate: 19, description: 'Standard VAT (Mehrwertsteuer)', isDefault: true },
    { name: 'MwSt 7%', rate: 7, description: 'Reduced VAT rate', isDefault: false },
    { name: 'MwSt 0%', rate: 0, description: 'Tax-exempt', isDefault: false },
  ],
  
  // France
  FR: [
    { name: 'TVA 20%', rate: 20, description: 'Standard VAT (TVA)', isDefault: true },
    { name: 'TVA 10%', rate: 10, description: 'Intermediate VAT rate', isDefault: false },
    { name: 'TVA 5.5%', rate: 5.5, description: 'Reduced VAT rate', isDefault: false },
    { name: 'TVA 2.1%', rate: 2.1, description: 'Super-reduced VAT rate', isDefault: false },
  ],
  
  // Singapore
  SG: [
    { name: 'GST 8%', rate: 8, description: 'Goods and Services Tax', isDefault: true },
    { name: 'GST 0%', rate: 0, description: 'Zero-rated supplies', isDefault: false },
  ],
  
  // United Arab Emirates
  AE: [
    { name: 'VAT 5%', rate: 5, description: 'Standard VAT rate', isDefault: true },
    { name: 'VAT 0%', rate: 0, description: 'Zero-rated supplies', isDefault: false },
  ],
  
  // Japan
  JP: [
    { name: 'Consumption Tax 10%', rate: 10, description: 'Standard consumption tax', isDefault: true },
    { name: 'Reduced Tax 8%', rate: 8, description: 'Reduced rate for food and beverages', isDefault: false },
  ],
  
  // China
  CN: [
    { name: 'VAT 13%', rate: 13, description: 'Standard VAT rate', isDefault: true },
    { name: 'VAT 9%', rate: 9, description: 'Reduced VAT rate', isDefault: false },
    { name: 'VAT 6%', rate: 6, description: 'Lower VAT rate for services', isDefault: false },
  ],
  
  // Brazil
  BR: [
    { name: 'ICMS 18%', rate: 18, description: 'Average state VAT', isDefault: true },
    { name: 'ISS 5%', rate: 5, description: 'Service tax', isDefault: false },
  ],
  
  // Mexico
  MX: [
    { name: 'IVA 16%', rate: 16, description: 'Standard VAT (IVA)', isDefault: true },
    { name: 'IVA 0%', rate: 0, description: 'Zero-rated', isDefault: false },
  ],
  
  // South Africa
  ZA: [
    { name: 'VAT 15%', rate: 15, description: 'Standard VAT rate', isDefault: true },
    { name: 'VAT 0%', rate: 0, description: 'Zero-rated supplies', isDefault: false },
  ],
  
  // New Zealand
  NZ: [
    { name: 'GST 15%', rate: 15, description: 'Goods and Services Tax', isDefault: true },
    { name: 'GST 0%', rate: 0, description: 'Zero-rated supplies', isDefault: false },
  ],
  
  // Default fallback
  DEFAULT: [
    { name: 'Standard Tax', rate: 10, description: 'Standard tax rate', isDefault: true },
    { name: 'No Tax', rate: 0, description: 'Tax-exempt', isDefault: false },
  ],
};

/**
 * Get tax templates for a specific country
 * @param countryCode ISO 3166-1 alpha-2 country code (e.g., 'US', 'IN', 'GB')
 * @returns Array of tax templates for the country
 */
export function getTaxTemplatesForCountry(countryCode: string): TaxTemplate[] {
  const upperCode = countryCode.toUpperCase();
  return TAX_TEMPLATES[upperCode] || TAX_TEMPLATES.DEFAULT;
}

/**
 * Check if tax templates exist for a country
 * @param countryCode ISO 3166-1 alpha-2 country code
 * @returns True if templates exist, false otherwise
 */
export function hasCountryTaxTemplates(countryCode: string): boolean {
  const upperCode = countryCode.toUpperCase();
  return upperCode in TAX_TEMPLATES && upperCode !== 'DEFAULT';
}

/**
 * Currency to country mapping for automatic tax detection
 */
const CURRENCY_TO_COUNTRY: Record<string, string> = {
  'USD': 'US',
  'INR': 'IN',
  'GBP': 'GB',
  'EUR': 'EU',
  'CAD': 'CA',
  'AUD': 'AU',
  'SGD': 'SG',
  'AED': 'AE',
  'JPY': 'JP',
  'CNY': 'CN',
  'BRL': 'BR',
  'MXN': 'MX',
  'ZAR': 'ZA',
  'NZD': 'NZ',
  'CHF': 'EU', // Switzerland uses EU-like VAT
  'SEK': 'EU', // Sweden
  'NOK': 'EU', // Norway
  'DKK': 'EU', // Denmark
  'PLN': 'EU', // Poland
  'CZK': 'EU', // Czech Republic
  'HUF': 'EU', // Hungary
  'RUB': 'EU', // Russia (similar VAT structure)
  'KRW': 'JP', // South Korea (similar to Japan)
  'THB': 'SG', // Thailand (similar to Singapore)
  'MYR': 'SG', // Malaysia
  'PHP': 'SG', // Philippines
  'IDR': 'SG', // Indonesia
  'VND': 'SG', // Vietnam
  'HKD': 'SG', // Hong Kong
  'TWD': 'JP', // Taiwan
};

/**
 * Get country code from currency code
 * @param currencyCode ISO 4217 currency code (e.g., 'USD', 'INR', 'GBP')
 * @returns ISO 3166-1 alpha-2 country code
 */
export function getCountryFromCurrency(currencyCode: string): string {
  const upperCode = currencyCode.toUpperCase();
  return CURRENCY_TO_COUNTRY[upperCode] || 'US'; // Default to US if unknown
}
