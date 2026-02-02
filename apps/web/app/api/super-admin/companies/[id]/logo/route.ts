import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// PATCH /api/super-admin/companies/[id]/logo - Update company logo
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;

    console.log('🖼️ Logo update request for company:', params.id);

    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        console.log('❌ Logo update: Unauthorized - no session');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "SUPER_ADMIN") {
        console.log('❌ Logo update: Forbidden - not super admin');
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { logoUrl } = body;

        console.log('📝 Received logoUrl:', logoUrl ? `${logoUrl.substring(0, 50)}...` : 'null');

        if (!logoUrl) {
            return NextResponse.json({
                error: "Logo URL is required",
                details: "Please provide a valid logoUrl in the request body"
            }, { status: 400 });
        }

        // First ensure logo column exists
        try {
            console.log('📋 Checking if logo column exists...');
            const columnCheck: any[] = await prisma.$queryRaw`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'tenants' AND column_name = 'logo'
            `;

            if (columnCheck.length === 0) {
                console.log('➕ Adding logo column to tenants table...');
                await prisma.$executeRawUnsafe(`ALTER TABLE tenants ADD COLUMN logo TEXT`);
                console.log('✅ Logo column added successfully');
            } else {
                console.log('✅ Logo column already exists');
            }
        } catch (e: any) {
            console.error('⚠️ Error checking/adding logo column:', e.message);
            // Continue anyway - column might exist
        }

        // Use raw SQL to avoid any Prisma schema sync issues
        console.log('💾 Updating logo in database...');
        const updateResult = await prisma.$executeRaw`
            UPDATE tenants SET logo = ${logoUrl}, updated_at = NOW() WHERE id = ${params.id}
        `;

        console.log(`✅ Update result: ${updateResult} row(s) affected`);

        // Fetch the updated company
        const companies: any[] = await prisma.$queryRaw`
            SELECT id, name, logo FROM tenants WHERE id = ${params.id}
        `;

        if (companies.length === 0) {
            console.log('❌ Company not found after update');
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        console.log('✅ Logo update successful for company:', companies[0].name);
        return NextResponse.json({ success: true, company: companies[0] });
    } catch (error: any) {
        console.error("❌ Failed to update logo:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        return NextResponse.json({
            error: "Failed to update logo",
            details: error.message
        }, { status: 500 });
    }
}

// DELETE /api/super-admin/companies/[id]/logo - Remove company logo
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;

    console.log('🗑️ Logo delete request for company:', params.id);

    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Use raw SQL to avoid Prisma schema sync issues
        await prisma.$executeRaw`
            UPDATE tenants SET logo = NULL, updated_at = NOW() WHERE id = ${params.id}
        `;

        // Fetch the updated company
        const companies: any[] = await prisma.$queryRaw`
            SELECT id, name, logo FROM tenants WHERE id = ${params.id}
        `;

        console.log('✅ Logo removed successfully');
        return NextResponse.json({ success: true, company: companies[0] || null });
    } catch (error: any) {
        console.error("❌ Failed to remove logo:", error);
        return NextResponse.json({
            error: "Failed to remove logo",
            details: error.message
        }, { status: 500 });
    }
}
