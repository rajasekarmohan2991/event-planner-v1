"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ templateId: string }>;
}

// GET /api/super-admin/tax-templates/[templateId] - Get single template
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { templateId } = await params;

        const template = await prisma.globalTaxTemplate.findUnique({
            where: { id: templateId },
            include: {
                _count: {
                    select: { taxStructures: true }
                }
            }
        });

        if (!template) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        return NextResponse.json({
            template: {
                ...template,
                createdBy: template.createdBy?.toString()
            }
        });
    } catch (error) {
        console.error("Error fetching tax template:", error);
        return NextResponse.json(
            { error: "Failed to fetch tax template" },
            { status: 500 }
        );
    }
}

// PUT /api/super-admin/tax-templates/[templateId] - Update template
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { templateId } = await params;
        const body = await request.json();

        const {
            name,
            rate,
            description,
            taxType,
            countryCode,
            effectiveFrom,
            effectiveUntil,
            appliesTo,
            isCompound,
            isActive
        } = body;

        // Validation
        if (rate !== undefined && (rate < 0 || rate > 100)) {
            return NextResponse.json(
                { error: "Rate must be between 0 and 100" },
                { status: 400 }
            );
        }

        // Validate dates if provided
        if (effectiveFrom && effectiveUntil) {
            const fromDate = new Date(effectiveFrom);
            const untilDate = new Date(effectiveUntil);
            if (fromDate >= untilDate) {
                return NextResponse.json(
                    { error: "Effective from date must be before effective until date" },
                    { status: 400 }
                );
            }
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (rate !== undefined) updateData.rate = parseFloat(rate);
        if (description !== undefined) updateData.description = description;
        if (taxType !== undefined) updateData.taxType = taxType;
        if (countryCode !== undefined) updateData.countryCode = countryCode;
        if (effectiveFrom !== undefined) updateData.effectiveFrom = effectiveFrom ? new Date(effectiveFrom) : null;
        if (effectiveUntil !== undefined) updateData.effectiveUntil = effectiveUntil ? new Date(effectiveUntil) : null;
        if (appliesTo !== undefined) updateData.appliesTo = appliesTo;
        if (isCompound !== undefined) updateData.isCompound = isCompound;
        if (isActive !== undefined) updateData.isActive = isActive;

        const template = await prisma.globalTaxTemplate.update({
            where: { id: templateId },
            data: updateData
        });

        // If template rate changed, optionally update linked tax structures that aren't custom
        if (rate !== undefined) {
            await prisma.taxStructure.updateMany({
                where: {
                    globalTemplateId: templateId,
                    isCustom: false
                },
                data: {
                    rate: parseFloat(rate),
                    name: name || template.name
                }
            });
        }

        return NextResponse.json({
            template: {
                ...template,
                createdBy: template.createdBy?.toString()
            },
            message: "Tax template updated successfully"
        });
    } catch (error) {
        console.error("Error updating tax template:", error);
        return NextResponse.json(
            { error: "Failed to update tax template" },
            { status: 500 }
        );
    }
}

// DELETE /api/super-admin/tax-templates/[templateId] - Delete template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { templateId } = await params;

        // Check if any companies are using this template
        const usageCount = await prisma.taxStructure.count({
            where: { globalTemplateId: templateId }
        });

        if (usageCount > 0) {
            // Option 1: Just deactivate instead of delete
            await prisma.globalTaxTemplate.update({
                where: { id: templateId },
                data: { isActive: false }
            });

            return NextResponse.json({
                message: `Template deactivated. ${usageCount} companies are using this template.`,
                deactivated: true
            });
        }

        // No usage, safe to delete
        await prisma.globalTaxTemplate.delete({
            where: { id: templateId }
        });

        return NextResponse.json({
            message: "Tax template deleted successfully",
            deleted: true
        });
    } catch (error) {
        console.error("Error deleting tax template:", error);
        return NextResponse.json(
            { error: "Failed to delete tax template" },
            { status: 500 }
        );
    }
}
