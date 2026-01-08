import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/super-admin/companies/[id]/logo - Update company logo
export async function PATCH(
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
        const { logoUrl } = await req.json();

        const company = await prisma.tenant.update({
            where: { id: params.id },
            data: { logo: logoUrl }
        });

        return NextResponse.json({ success: true, company });
    } catch (error: any) {
        console.error("Failed to update logo:", error);
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
        const company = await prisma.tenant.update({
            where: { id: params.id },
            data: { logo: null }
        });

        return NextResponse.json({ success: true, company });
    } catch (error: any) {
        console.error("Failed to remove logo:", error);
        return NextResponse.json({ 
            error: "Failed to remove logo", 
            details: error.message 
        }, { status: 500 });
    }
}
