import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// PATCH /api/company/logo - Update company logo (for logged-in company)
export async function PATCH(req: NextRequest) {
    console.log('🖼️ Company logo update request');

    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        console.log('❌ Unauthorized - no session');
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
        const body = await req.json();
        const { logoUrl } = body;

        console.log('📝 Received logoUrl:', logoUrl ? `${logoUrl.substring(0, 50)}...` : 'null');

        if (!logoUrl) {
            return NextResponse.json({
                error: "Logo URL is required"
            }, { status: 400 });
        }

        // Ensure logo column exists
        try {
            console.log('📋 Checking logo column...');
            const columnCheck: any[] = await prisma.$queryRaw`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'tenants' AND column_name = 'logo'
            `;

            if (columnCheck.length === 0) {
                console.log('➕ Adding logo column...');
                await prisma.$executeRawUnsafe(`ALTER TABLE tenants ADD COLUMN logo TEXT`);
                console.log('✅ Column added');
            }
        } catch (e: any) {
            console.warn('⚠️ Column check error:', e.message);
        }

        // Update logo
        console.log('💾 Updating logo...');
        await prisma.$executeRaw`
            UPDATE tenants 
            SET logo = ${logoUrl}, updated_at = NOW() 
            WHERE id = ${tenantId}
        `;

        // Fetch updated company
        const companies: any[] = await prisma.$queryRaw`
            SELECT id, name, logo FROM tenants WHERE id = ${tenantId}
        `;

        if (companies.length === 0) {
            console.log('❌ Company not found');
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        console.log('✅ Logo updated successfully');
        return NextResponse.json({
            success: true,
            company: companies[0]
        });
    } catch (error: any) {
        console.error("❌ Logo update failed:", error);
        console.error("Error:", {
            message: error.message,
            code: error.code,
            stack: error.stack?.split('\n').slice(0, 3)
        });

        return NextResponse.json({
            error: "Failed to update logo",
            details: error.message
        }, { status: 500 });
    }
}

// DELETE /api/company/logo - Remove company logo
export async function DELETE(req: NextRequest) {
    console.log('🗑️ Company logo delete request');

    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId || user.currentTenantId;

    if (!tenantId) {
        return NextResponse.json({ error: "No company context" }, { status: 400 });
    }

    try {
        await prisma.$executeRaw`
            UPDATE tenants 
            SET logo = NULL, updated_at = NOW() 
            WHERE id = ${tenantId}
        `;

        const companies: any[] = await prisma.$queryRaw`
            SELECT id, name, logo FROM tenants WHERE id = ${tenantId}
        `;

        console.log('✅ Logo removed');
        return NextResponse.json({
            success: true,
            company: companies[0] || null
        });
    } catch (error: any) {
        console.error("❌ Logo delete failed:", error);
        return NextResponse.json({
            error: "Failed to remove logo",
            details: error.message
        }, { status: 500 });
    }
}
