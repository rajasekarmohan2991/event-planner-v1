import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getServerSession(authOptions as any);
    if ((session?.user as any)?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = 'then' in context.params ? await context.params : context.params;
    const { id } = params;

    // Ensure connection implicitly handled by lib/prisma

    const tenant = await prisma.tenant.findUnique({ where: { id } });

    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    const features = (tenant.features as any) || {};

    return NextResponse.json({
        enableFinance: features.finance || false,
        digitalSignatureUrl: tenant.digitalSignatureUrl
    });
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getServerSession(authOptions as any);
    if ((session?.user as any)?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = 'then' in context.params ? await context.params : context.params;
    const { id } = params;

    try {
        const body = await req.json();
        const { enableFinance, digitalSignatureUrl } = body;

        const tenant = await prisma.tenant.findUnique({ where: { id } });
        if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

        const currentFeatures = (tenant.features as any) || {};
        const newFeatures = {
            ...currentFeatures,
            finance: enableFinance
        };

        const updated = await prisma.tenant.update({
            where: { id },
            data: {
                features: newFeatures,
                digitalSignatureUrl: digitalSignatureUrl
            }
        });

        return NextResponse.json({ success: true, tenant: updated });
    } catch (error) {
        console.error("Failed to update finance settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
