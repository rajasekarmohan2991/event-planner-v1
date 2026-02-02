"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/super-admin/tax-templates - Get all global tax templates
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get("includeInactive") === "true";
        const countryCode = searchParams.get("countryCode");

        const where: any = {};

        if (!includeInactive) {
            where.isActive = true;
        }

        if (countryCode) {
            where.countryCode = countryCode;
        }

        const templates = await prisma.globalTaxTemplate.findMany({
            where,
            orderBy: [
                { countryCode: "asc" },
                { name: "asc" }
            ],
            include: {
                _count: {
                    select: { taxStructures: true }
                }
            }
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

// POST /api/super-admin/tax-templates - Create a new global tax template
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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
        if (!name || rate === undefined || rate === null) {
            return NextResponse.json(
                { error: "Name and rate are required" },
                { status: 400 }
            );
        }

        if (rate < 0 || rate > 100) {
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

        const template = await prisma.globalTaxTemplate.create({
            data: {
                name,
                rate: parseFloat(rate),
                description: description || null,
                taxType: taxType || "GST",
                countryCode: countryCode || null,
                effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
                effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
                appliesTo: appliesTo || "ALL",
                isCompound: isCompound || false,
                isActive: isActive !== false,
                createdBy: BigInt((session.user as any).id)
            }
        });

        return NextResponse.json({
            template: {
                ...template,
                createdBy: template.createdBy?.toString()
            },
            message: "Tax template created successfully"
        });
    } catch (error) {
        console.error("Error creating global tax template:", error);
        return NextResponse.json(
            { error: "Failed to create tax template" },
            { status: 500 }
        );
    }
}
