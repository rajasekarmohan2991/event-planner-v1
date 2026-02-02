"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getDefaultTaxesForCountry } from "@/lib/default-taxes";

// POST /api/company/tax-structures/auto-populate - Auto-populate default taxes based on company country
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenantId = (session.user as any)?.tenantId || (session.user as any)?.currentTenantId;

        if (!tenantId) {
            return NextResponse.json({ error: "No company context" }, { status: 400 });
        }

        // Get company country
        let countryCode: string | undefined;
        try {
            const tenant = await prisma.$queryRaw<any[]>`
                SELECT country FROM tenants WHERE id = ${tenantId} LIMIT 1
            `;
            countryCode = tenant[0]?.country;
        } catch (e) {
            console.warn("Could not fetch company country:", e);
        }

        // Get default taxes for country
        const defaultTaxes = getDefaultTaxesForCountry(countryCode);

        const createdTaxes = [];

        // Create each default tax
        for (const tax of defaultTaxes) {
            try {
                // Check if a tax with this name already exists
                const existing = await prisma.$queryRaw<any[]>`
                    SELECT id FROM tax_structures 
                    WHERE tenant_id = ${tenantId} AND name = ${tax.name}
                    LIMIT 1
                `;

                if (existing.length > 0) {
                    console.log(`Tax "${tax.name}" already exists, skipping`);
                    continue;
                }

                // Create the tax structure
                const taxId = `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                await prisma.$executeRaw`
                    INSERT INTO tax_structures (
                        id, tenant_id, name, rate, description, is_default, is_custom, created_at, updated_at
                    ) VALUES (
                        ${taxId}, ${tenantId}, ${tax.name}, ${tax.rate}, ${tax.description}, 
                        ${tax.isDefault}, true, NOW(), NOW()
                    )
                `;

                createdTaxes.push({
                    id: taxId,
                    name: tax.name,
                    rate: tax.rate,
                    description: tax.description,
                    isDefault: tax.isDefault
                });

            } catch (error) {
                console.error(`Failed to create tax: ${tax.name}`, error);
            }
        }

        return NextResponse.json({
            message: `Successfully created ${createdTaxes.length} default tax structures`,
            taxes: createdTaxes,
            country: countryCode || "DEFAULT"
        }, { status: 201 });

    } catch (error) {
        console.error("Error auto-populating taxes:", error);
        return NextResponse.json(
            { error: "Failed to auto-populate taxes" },
            { status: 500 }
        );
    }
}
