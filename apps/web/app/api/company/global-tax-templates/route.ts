"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/company/global-tax-templates - Get available global tax templates for company
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenantId = (session.user as any)?.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: "No company context" }, { status: 400 });
        }

        // Get company country for filtering
        let countryCode: string | null = null;
        try {
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { country: true }
            });
            countryCode = tenant?.country || null;
        } catch (e) {
            // Country field might not exist
        }

        const now = new Date();

        // Try to get templates using raw SQL for reliability
        let templates: any[] = [];

        try {
            templates = await prisma.$queryRaw`
                SELECT 
                    id, name, rate, description, tax_type as "taxType", 
                    country_code as "countryCode", is_active as "isActive",
                    effective_from as "effectiveFrom", effective_until as "effectiveUntil",
                    applies_to as "appliesTo", is_compound as "isCompound"
                FROM global_tax_templates
                WHERE is_active = true
                ORDER BY country_code ASC NULLS LAST, name ASC
            `;
        } catch (dbError: any) {
            console.error("Error querying global_tax_templates:", dbError);

            // If table doesn't exist, return empty array
            if (dbError.message?.includes('does not exist') || dbError.code === '42P01') {
                console.warn("global_tax_templates table does not exist yet");
                return NextResponse.json({ templates: [] });
            }

            throw dbError;
        }

        // Filter by effective dates and country in JavaScript
        const filteredTemplates = templates.filter((template: any) => {
            // Check effective dates
            const effectiveFrom = template.effectiveFrom ? new Date(template.effectiveFrom) : null;
            const effectiveUntil = template.effectiveUntil ? new Date(template.effectiveUntil) : null;

            const isEffective =
                (!effectiveFrom || effectiveFrom <= now) &&
                (!effectiveUntil || effectiveUntil >= now);

            // Check country match (include global templates with null country)
            const matchesCountry = !countryCode ||
                !template.countryCode ||
                template.countryCode === countryCode;

            return isEffective && matchesCountry;
        });

        return NextResponse.json({ templates: filteredTemplates });
    } catch (error) {
        console.error("Error fetching global tax templates:", error);
        return NextResponse.json(
            { error: "Failed to fetch tax templates" },
            { status: 500 }
        );
    }
}
