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

        // Fetch taxes using Prisma Client
        let taxes = await prisma.taxStructure.findMany({
            where: { tenantId },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ],
            include: {
                globalTemplate: true
            }
        });

        // Auto-populate if empty
        if (taxes.length === 0) {
            console.log('No tax structures found, attempting auto-population...');

            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { country: true, currency: true }
            });

            if (tenant) {
                const country = tenant.country || 'IN';

                const defaultTaxes: Record<string, { name: string; rate: number; description: string }> = {
                    'IN': { name: 'GST (18%)', rate: 18.0, description: 'Goods and Services Tax' },
                    'US': { name: 'Sales Tax', rate: 8.5, description: 'State Sales Tax' },
                    'GB': { name: 'VAT (20%)', rate: 20.0, description: 'Value Added Tax' },
                    'AU': { name: 'GST (10%)', rate: 10.0, description: 'Goods and Services Tax' },
                    'CA': { name: 'GST/HST', rate: 13.0, description: 'Goods and Services Tax' },
                    'SG': { name: 'GST (9%)', rate: 9.0, description: 'Goods and Services Tax' },
                    'AE': { name: 'VAT (5%)', rate: 5.0, description: 'Value Added Tax' }
                };

                const template = defaultTaxes[country] || defaultTaxes['IN'];

                try {
                    await prisma.taxStructure.create({
                        data: {
                            name: template.name,
                            rate: template.rate,
                            description: template.description,
                            isDefault: true,
                            isCustom: false,
                            tenantId: tenantId
                        }
                    });

                    // Fetch again
                    taxes = await prisma.taxStructure.findMany({
                        where: { tenantId },
                        orderBy: [
                            { isDefault: 'desc' },
                            { createdAt: 'desc' }
                        ],
                        include: {
                            globalTemplate: true
                        }
                    });
                } catch (createError) {
                    console.error('Failed to auto-create tax structure:', createError);
                }
            }
        }

        return NextResponse.json({ taxes });
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
