import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/super-admin/finance/summary - Get financial summary across all companies
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Get all invoices using raw SQL
        const invoices = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                i.id, i.status, i.grand_total, i.due_date, i.created_at,
                t.name as tenant_name,
                e.name as event_name
            FROM invoices i
            LEFT JOIN tenants t ON i.tenant_id = t.id
            LEFT JOIN events e ON i.event_id = e.id
        `);

        // Calculate summary
        const totalRevenue = invoices
            .filter(inv => inv.status === "PAID")
            .reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);

        const pendingPayments = invoices
            .filter(inv => inv.status === "PENDING" || inv.status === "SENT")
            .reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);

        const completedPayments = invoices
            .filter(inv => inv.status === "PAID")
            .reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);

        const overdueInvoices = invoices.filter(inv => {
            if (inv.status === "PAID") return false;
            return new Date(inv.due_date) < new Date();
        }).length;

        // Calculate monthly revenue (current month)
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const currentMonthRevenue = invoices
            .filter(inv =>
                inv.status === "PAID" &&
                new Date(inv.created_at) >= currentMonthStart
            )
            .reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);

        const lastMonthRevenue = invoices
            .filter(inv =>
                inv.status === "PAID" &&
                new Date(inv.created_at) >= lastMonthStart &&
                new Date(inv.created_at) <= lastMonthEnd
            )
            .reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);

        const monthlyGrowth = lastMonthRevenue > 0
            ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        return NextResponse.json({
            summary: {
                totalRevenue,
                pendingPayments,
                completedPayments,
                overdueInvoices,
                monthlyRevenue: currentMonthRevenue,
                monthlyGrowth: Math.round(monthlyGrowth * 10) / 10
            }
        });
    } catch (error: any) {
        console.error("Failed to fetch financial summary:", error);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
