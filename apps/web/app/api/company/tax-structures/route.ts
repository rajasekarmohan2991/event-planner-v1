"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/company/tax-structures - Get company's tax structures
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenantId = (session.user as any)?.tenantId || (session.user as any)?.currentTenantId;

        if (!tenantId) {
            return NextResponse.json({
                error: "No company context",
                taxes: []
            }, { status: 200 });
        }

        console.log(`Fetching taxes for company: ${tenantId}`);

        // Fetch taxes using Raw SQL to ensure we get all new columns
        // and filter out archived ones
        const taxes: any[] = await prisma.$queryRawUnsafe(`
            SELECT 
                id, name, rate, description, 
                is_default as "isDefault", 
                COALESCE(is_custom, true) as "isCustom",
                global_template_id as "globalTemplateId",
                country_code as "countryCode",
                currency_code as "currencyCode",
                effective_from as "effectiveFrom",
                effective_to as "effectiveTo",
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM tax_structures 
            WHERE tenant_id = $1 
              AND (archived = FALSE OR archived IS NULL)
            ORDER BY is_default DESC, effective_from DESC NULLS LAST, created_at DESC
        `, tenantId);

        console.log(`Found ${taxes.length} taxes for company`);

        // If no taxes found, checking for potential auto-population or fallback is handled by the Super Admin
        // Here we just return what exists. By default, Super Admin should have created taxes.

        return NextResponse.json({ taxes });
    } catch (error: any) {
        console.error("Error fetching company tax structures:", error);
        return NextResponse.json(
            { error: "Failed to fetch tax structures", details: error.message, taxes: [] },
            { status: 500 }
        );
    }
}

// POST /api/company/tax-structures - Create new tax structure
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenantId = (session.user as any)?.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: "No company context" }, { status: 400 });
        }

        const body = await request.json();
        const { name, rate, description, isDefault, globalTemplateId, isCustom } = body;

        // Validation
        if (!name || rate === undefined || rate === null) {
            return NextResponse.json(
                { error: "Name and rate are required" },
                { status: 400 }
            );
        }

        const parsedRate = parseFloat(rate);
        if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
            return NextResponse.json(
                { error: "Rate must be a valid number between 0 and 100" },
                { status: 400 }
            );
        }

        // If using a global template, verify it exists and is active
        if (globalTemplateId) {
            const template = await prisma.globalTaxTemplate.findUnique({
                where: { id: globalTemplateId }
            });
            if (!template || !template.isActive) {
                return NextResponse.json(
                    { error: "Global tax template not found or inactive" },
                    { status: 400 }
                );
            }
        }

        // If setting as default, unset others
        if (isDefault) {
            await prisma.taxStructure.updateMany({
                where: { tenantId, isDefault: true },
                data: { isDefault: false }
            });
        }

        const tax = await prisma.taxStructure.create({
            data: {
                name,
                rate: parsedRate,
                description: description || null,
                isDefault: isDefault || false,
                tenantId,
                globalTemplateId: globalTemplateId || null,
                isCustom: isCustom === true || !globalTemplateId
            },
            include: {
                globalTemplate: true
            }
        });

        return NextResponse.json({ tax, message: "Tax structure created" }, { status: 201 });
    } catch (error) {
        console.error("Error creating company tax structure:", error);
        return NextResponse.json(
            { error: "Failed to create tax structure" },
            { status: 500 }
        );
    }
}
