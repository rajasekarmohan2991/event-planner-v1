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

        // Get active templates, optionally filtered by country
        const templates = await prisma.globalTaxTemplate.findMany({
            where: {
                isActive: true,
                OR: [
                    { effectiveFrom: null },
                    { effectiveFrom: { lte: now } }
                ],
                AND: [
                    {
                        OR: [
                            { effectiveUntil: null },
                            { effectiveUntil: { gte: now } }
                        ]
                    }
                ],
                // Include both country-specific and global templates
                ...(countryCode ? {
                    OR: [
                        { countryCode },
                        { countryCode: null }
                    ]
                } : {})
            },
            orderBy: [
                { countryCode: "asc" },
                { name: "asc" }
            ]
        });

        return NextResponse.json({ templates });
    } catch (error) {
        console.error("Error fetching global tax templates:", error);
        return NextResponse.json(
            { error: "Failed to fetch tax templates" },
            { status: 500 }
        );
    }
}
