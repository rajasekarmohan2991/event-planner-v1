// Auto-populate default tax structures based on company country
// This runs when a company first accesses tax settings and has no taxes configured

interface DefaultTaxConfig {
    name: string;
    rate: number;
    description: string;
    taxType: string;
    isDefault: boolean;
}

const DEFAULT_TAXES_BY_COUNTRY: Record<string, DefaultTaxConfig[]> = {
    // India
    IN: [
        {
            name: "GST 18%",
            rate: 18.0,
            description: "Standard GST rate for goods and services",
            taxType: "GST",
            isDefault: true
        },
        {
            name: "GST 12%",
            rate: 12.0,
            description: "Reduced GST rate",
            taxType: "GST",
            isDefault: false
        },
        {
            name: "GST 5%",
            rate: 5.0,
            description: "Lower GST rate for essential items",
            taxType: "GST",
            isDefault: false
        }
    ],

    // United States
    US: [
        {
            name: "Sales Tax 7.5%",
            rate: 7.5,
            description: "Standard sales tax rate",
            taxType: "SALES_TAX",
            isDefault: true
        },
        {
            name: "Sales Tax 5%",
            rate: 5.0,
            description: "Reduced sales tax rate",
            taxType: "SALES_TAX",
            isDefault: false
        }
    ],

    // United Kingdom
    GB: [
        {
            name: "VAT 20%",
            rate: 20.0,
            description: "Standard VAT rate",
            taxType: "VAT",
            isDefault: true
        },
        {
            name: "VAT 5%",
            rate: 5.0,
            description: "Reduced VAT rate",
            taxType: "VAT",
            isDefault: false
        },
        {
            name: "VAT 0%",
            rate: 0.0,
            description: "Zero-rated VAT",
            taxType: "VAT",
            isDefault: false
        }
    ],

    // Canada
    CA: [
        {
            name: "HST 13%",
            rate: 13.0,
            description: "Harmonized Sales Tax",
            taxType: "HST",
            isDefault: true
        },
        {
            name: "GST 5%",
            rate: 5.0,
            description: "Goods and Services Tax",
            taxType: "GST",
            isDefault: false
        }
    ],

    // Australia
    AU: [
        {
            name: "GST 10%",
            rate: 10.0,
            description: "Goods and Services Tax",
            taxType: "GST",
            isDefault: true
        }
    ],

    // Germany
    DE: [
        {
            name: "VAT 19%",
            rate: 19.0,
            description: "Standard VAT rate",
            taxType: "VAT",
            isDefault: true
        },
        {
            name: "VAT 7%",
            rate: 7.0,
            description: "Reduced VAT rate",
            taxType: "VAT",
            isDefault: false
        }
    ],

    // France
    FR: [
        {
            name: "VAT 20%",
            rate: 20.0,
            description: "Standard VAT rate",
            taxType: "VAT",
            isDefault: true
        },
        {
            name: "VAT 10%",
            rate: 10.0,
            description: "Intermediate VAT rate",
            taxType: "VAT",
            isDefault: false
        }
    ],

    // Singapore
    SG: [
        {
            name: "GST 8%",
            rate: 8.0,
            description: "Goods and Services Tax",
            taxType: "GST",
            isDefault: true
        }
    ],

    // UAE
    AE: [
        {
            name: "VAT 5%",
            rate: 5.0,
            description: "Value Added Tax",
            taxType: "VAT",
            isDefault: true
        }
    ],

    // Default (if country not found)
    DEFAULT: [
        {
            name: "Standard Tax 10%",
            rate: 10.0,
            description: "Standard tax rate",
            taxType: "OTHER",
            isDefault: true
        }
    ]
};

export function getDefaultTaxesForCountry(countryCode?: string): DefaultTaxConfig[] {
    if (!countryCode) {
        return DEFAULT_TAXES_BY_COUNTRY.DEFAULT;
    }

    return DEFAULT_TAXES_BY_COUNTRY[countryCode] || DEFAULT_TAXES_BY_COUNTRY.DEFAULT;
}

export async function autoPopulateTaxes(tenantId: string, countryCode?: string) {
    const defaultTaxes = getDefaultTaxesForCountry(countryCode);

    const createdTaxes = [];

    for (const tax of defaultTaxes) {
        try {
            const response = await fetch('/api/company/tax-structures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: tax.name,
                    rate: tax.rate,
                    description: tax.description,
                    isDefault: tax.isDefault,
                    isCustom: true,
                    globalTemplateId: null
                })
            });

            if (response.ok) {
                const data = await response.json();
                createdTaxes.push(data.tax);
            }
        } catch (error) {
            console.error(`Failed to create tax: ${tax.name}`, error);
        }
    }

    return createdTaxes;
}
