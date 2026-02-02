import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenantId = (session.user as any).currentTenantId;
        if (!tenantId) {
            return NextResponse.json({ error: "No tenant context" }, { status: 400 });
        }

        const settings = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                id, tenant_id as "tenantId",
                enable_invoicing as "enableInvoicing",
                enable_payouts as "enablePayouts",
                enable_charges as "enableCharges",
                default_currency as "defaultCurrency",
                default_payment_terms as "defaultPaymentTerms",
                default_tax_rate as "defaultTaxRate",
                tax_registration_number as "taxRegistrationNumber",
                bank_name as "bankName",
                account_number as "accountNumber",
                ifsc_code as "ifscCode",
                account_holder as "accountHolder",
                digital_signature_url as "digitalSignatureUrl",
                invoice_prefix as "invoicePrefix",
                invoice_footer as "invoiceFooter",
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM finance_settings
            WHERE tenant_id = $1
            LIMIT 1
        `, tenantId);

        if (settings.length === 0) {
            // Return default settings
            return NextResponse.json({
                settings: {
                    enableInvoicing: true,
                    enablePayouts: true,
                    enableCharges: true,
                    defaultCurrency: "USD",
                    defaultPaymentTerms: 30,
                    defaultTaxRate: 0,
                    invoicePrefix: "INV"
                }
            });
        }

        return NextResponse.json({ settings: settings[0] });
    } catch (error: any) {
        console.error("❌ [FINANCE SETTINGS] Failed to fetch settings:", error);
        
        if (error.message?.includes('relation "finance_settings" does not exist')) {
            return NextResponse.json({
                settings: {
                    enableInvoicing: true,
                    enablePayouts: true,
                    enableCharges: true,
                    defaultCurrency: "USD",
                    defaultPaymentTerms: 30,
                    defaultTaxRate: 0,
                    invoicePrefix: "INV"
                }
            });
        }
        
        return NextResponse.json({ 
            error: "Failed to fetch settings", 
            details: error.message 
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenantId = (session.user as any).currentTenantId;
        if (!tenantId) {
            return NextResponse.json({ error: "No tenant context" }, { status: 400 });
        }

        const body = await req.json();
        const {
            enableInvoicing = true,
            enablePayouts = true,
            enableCharges = true,
            defaultCurrency = "USD",
            defaultPaymentTerms = 30,
            defaultTaxRate = 0,
            taxRegistrationNumber,
            bankName,
            accountNumber,
            ifscCode,
            accountHolder,
            digitalSignatureUrl,
            invoicePrefix = "INV",
            invoiceFooter
        } = body;

        // Check if settings exist
        const existing = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id FROM finance_settings WHERE tenant_id = $1 LIMIT 1
        `, tenantId);

        if (existing.length > 0) {
            // Update existing settings
            await prisma.$executeRawUnsafe(`
                UPDATE finance_settings SET
                    enable_invoicing = $2,
                    enable_payouts = $3,
                    enable_charges = $4,
                    default_currency = $5,
                    default_payment_terms = $6,
                    default_tax_rate = $7,
                    tax_registration_number = $8,
                    bank_name = $9,
                    account_number = $10,
                    ifsc_code = $11,
                    account_holder = $12,
                    digital_signature_url = $13,
                    invoice_prefix = $14,
                    invoice_footer = $15,
                    updated_at = NOW()
                WHERE tenant_id = $1
            `,
                tenantId, enableInvoicing, enablePayouts, enableCharges,
                defaultCurrency, defaultPaymentTerms, defaultTaxRate,
                taxRegistrationNumber, bankName, accountNumber, ifscCode,
                accountHolder, digitalSignatureUrl, invoicePrefix, invoiceFooter
            );
        } else {
            // Create new settings
            const settingsId = `settings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await prisma.$executeRawUnsafe(`
                INSERT INTO finance_settings (
                    id, tenant_id, enable_invoicing, enable_payouts, enable_charges,
                    default_currency, default_payment_terms, default_tax_rate,
                    tax_registration_number, bank_name, account_number, ifsc_code,
                    account_holder, digital_signature_url, invoice_prefix, invoice_footer,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
                )
            `,
                settingsId, tenantId, enableInvoicing, enablePayouts, enableCharges,
                defaultCurrency, defaultPaymentTerms, defaultTaxRate,
                taxRegistrationNumber, bankName, accountNumber, ifscCode,
                accountHolder, digitalSignatureUrl, invoicePrefix, invoiceFooter
            );
        }

        return NextResponse.json({ 
            success: true,
            message: "Finance settings updated successfully" 
        });
    } catch (error: any) {
        console.error("❌ [FINANCE SETTINGS] Failed to update settings:", error);
        
        if (error.message?.includes('relation "finance_settings" does not exist')) {
            return NextResponse.json({ 
                error: "Finance settings feature not yet configured.",
                details: "Database tables need to be created"
            }, { status: 503 });
        }
        
        return NextResponse.json({ 
            error: "Failed to update settings", 
            details: error.message 
        }, { status: 500 });
    }
}
