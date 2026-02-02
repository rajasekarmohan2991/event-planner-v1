"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ taxId: string }>;
}

// GET /api/company/tax-structures/[taxId] - Get single tax structure
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenantId = (session.user as any)?.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: "No company context" }, { status: 400 });
        }

        const { taxId } = await params;

        const tax = await prisma.taxStructure.findFirst({
            where: { id: taxId, tenantId },
            include: {
                globalTemplate: true
            }
        });

        if (!tax) {
            return NextResponse.json({ error: "Tax structure not found" }, { status: 404 });
        }

        return NextResponse.json({ tax });
    } catch (error) {
        console.error("Error fetching tax structure:", error);
        return NextResponse.json(
            { error: "Failed to fetch tax structure" },
            { status: 500 }
        );
    }
}

// PUT /api/company/tax-structures/[taxId] - Update tax structure
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenantId = (session.user as any)?.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: "No company context" }, { status: 400 });
        }

        const { taxId } = await params;
        const body = await request.json();
        const { name, rate, description, isDefault, globalTemplateId, isCustom } = body;

        // Verify ownership
        const existing = await prisma.taxStructure.findFirst({
            where: { id: taxId, tenantId }
        });

        if (!existing) {
            return NextResponse.json({ error: "Tax structure not found" }, { status: 404 });
        }

        // Validation
        const parsedRate = rate !== undefined ? parseFloat(rate) : existing.rate;
        if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
            return NextResponse.json(
                { error: "Rate must be a valid number between 0 and 100" },
                { status: 400 }
            );
        }

        // If using a global template, verify it exists
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
                where: { tenantId, isDefault: true, id: { not: taxId } },
                data: { isDefault: false }
            });
        }

        const tax = await prisma.taxStructure.update({
            where: { id: taxId },
            data: {
                name: name || existing.name,
                rate: parsedRate,
                description: description !== undefined ? description : existing.description,
                isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
                globalTemplateId: globalTemplateId !== undefined ? (globalTemplateId || null) : existing.globalTemplateId,
                isCustom: isCustom !== undefined ? isCustom : (globalTemplateId === null || globalTemplateId === undefined)
            },
            include: {
                globalTemplate: true
            }
        });

        return NextResponse.json({ tax, message: "Tax structure updated" });
    } catch (error) {
        console.error("Error updating tax structure:", error);
        return NextResponse.json(
            { error: "Failed to update tax structure" },
            { status: 500 }
        );
    }
}

// DELETE /api/company/tax-structures/[taxId] - Delete tax structure
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenantId = (session.user as any)?.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: "No company context" }, { status: 400 });
        }

        const { taxId } = await params;

        // Verify ownership
        const existing = await prisma.taxStructure.findFirst({
            where: { id: taxId, tenantId }
        });

        if (!existing) {
            return NextResponse.json({ error: "Tax structure not found" }, { status: 404 });
        }

        await prisma.taxStructure.delete({
            where: { id: taxId }
        });

        return NextResponse.json({ message: "Tax structure deleted" });
    } catch (error) {
        console.error("Error deleting tax structure:", error);
        return NextResponse.json(
            { error: "Failed to delete tax structure" },
            { status: 500 }
        );
    }
}
