import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/company/info - Get current company information
export async function GET(req: NextRequest) {
    console.log('📋 Company info request');

    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        console.log('❌ Unauthorized');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId || user.currentTenantId;

    if (!tenantId) {
        console.log('❌ No tenant context');
        return NextResponse.json({ error: "No company context" }, { status: 400 });
    }

    console.log('👤 User:', user.email, 'Tenant:', tenantId);

    try {
        // Fetch company info
        const companies: any[] = await prisma.$queryRaw`
            SELECT id, name, logo, status, created_at as "createdAt"
            FROM tenants 
            WHERE id = ${tenantId}
        `;

        if (companies.length === 0) {
            console.log('❌ Company not found');
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        console.log('✅ Company info retrieved:', companies[0].name);
        return NextResponse.json({
            company: companies[0]
        });
    } catch (error: any) {
        console.error("❌ Failed to get company info:", error);
        return NextResponse.json({
            error: "Failed to get company info",
            details: error.message
        }, { status: 500 });
    }
}
