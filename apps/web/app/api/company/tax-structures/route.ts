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

        console.log('Tax structures GET - Session user:', {
            id: (session.user as any)?.id,
            email: (session.user as any)?.email,
            tenantId,
            currentTenantId: (session.user as any)?.currentTenantId
        });

        if (!tenantId) {
            return NextResponse.json({
                error: "No company context",
                taxes: []
            }, { status: 200 }); // Return empty array instead of error
        }

        // Use raw SQL for reliability
        try {
            const taxes = await prisma.$queryRaw`
                SELECT 
                    ts.id,
                    ts.name,
                    ts.rate,
                    ts.description,
                    ts.is_default as "isDefault",
                    ts.is_custom as "isCustom",
                    ts.global_template_id as "globalTemplateId",
                    ts.created_at as "createdAt",
                    ts.updated_at as "updatedAt"
                FROM tax_structures ts
                WHERE ts.tenant_id = ${tenantId}
                ORDER BY ts.is_default DESC, ts.created_at DESC
            `;

            return NextResponse.json({ taxes });
        } catch (dbError: any) {
            console.error("Database error fetching tax structures:", dbError);

            // If table doesn't exist, return empty array
            if (dbError.message?.includes('does not exist') || dbError.code === '42P01') {
                console.warn("tax_structures table does not exist yet");
                return NextResponse.json({ taxes: [] });
            }

            throw dbError;
        }
    } catch (error) {
        console.error("Error fetching company tax structures:", error);
        return NextResponse.json(
            { error: "Failed to fetch tax structures", taxes: [] },
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
