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
    
    console.log('Logo update request for company:', params.id);
    
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        console.log('Logo update: Unauthorized - no session');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "SUPER_ADMIN") {
        console.log('Logo update: Forbidden - not super admin');
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { logoUrl } = body;
        
        console.log('Logo update: Received logoUrl:', logoUrl ? `${logoUrl.substring(0, 50)}...` : 'null');

        if (!logoUrl) {
            return NextResponse.json({ 
                error: "Logo URL is required",
                details: "Please provide a valid logoUrl in the request body"
            }, { status: 400 });
        }

        // First ensure logo column exists
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo TEXT`);
        } catch (e) {
            // Column might already exist, ignore
        }

        // Use raw SQL to avoid any Prisma schema sync issues
        await prisma.$executeRawUnsafe(`
            UPDATE tenants SET logo = $1, updated_at = NOW() WHERE id = $2
        `, logoUrl, params.id);

        // Fetch the updated company
        const companies: any[] = await prisma.$queryRawUnsafe(`
            SELECT id, name, logo FROM tenants WHERE id = $1
        `, params.id);

        if (companies.length === 0) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        console.log('Logo update: Success for company', companies[0].name);
        return NextResponse.json({ success: true, company: companies[0] });
    } catch (error: any) {
        console.error("Failed to update logo:", error);
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
        await prisma.$executeRawUnsafe(`
            UPDATE tenants SET logo = NULL, updated_at = NOW() WHERE id = $1
        `, params.id);

        // Fetch the updated company
        const companies: any[] = await prisma.$queryRawUnsafe(`
            SELECT id, name, logo FROM tenants WHERE id = $1
        `, params.id);

        return NextResponse.json({ success: true, company: companies[0] || null });
    } catch (error: any) {
        console.error("Failed to remove logo:", error);
        return NextResponse.json({ 
            error: "Failed to remove logo", 
            details: error.message 
        }, { status: 500 });
    }
}
