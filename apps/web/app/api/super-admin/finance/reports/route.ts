import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
        const { searchParams } = new URL(req.url);
        const timeRange = searchParams.get("timeRange") || "12M";
        const companyFilter = searchParams.get("company") || "ALL";

        // Calculate date range
        const now = new Date();
        let startDate = new Date();

        switch (timeRange) {
            case "3M":
                startDate.setMonth(now.getMonth() - 3);
                break;
            case "6M":
                startDate.setMonth(now.getMonth() - 6);
                break;
            case "12M":
                startDate.setMonth(now.getMonth() - 12);
                break;
            case "ALL":
                startDate = new Date(2020, 0, 1); // Far past date
                break;
        }

        // Fetch all invoices in range
        const where: any = {
            createdAt: { gte: startDate }
        };

        if (companyFilter !== "ALL") {
            where.tenantId = companyFilter;
        }

        // Build WHERE clause for raw SQL
        let whereSQL = `WHERE i.created_at >= $1`;
        const params: any[] = [startDate];
        
        if (companyFilter !== "ALL") {
            whereSQL += ` AND i.tenant_id = $2`;
            params.push(companyFilter);
        }

        const invoices = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                i.id, i.status, i.grand_total, i.due_date, i.created_at,
                i.recipient_type, i.recipient_name, i.currency,
                t.name as tenant_name,
                e.name as event_name,
                COALESCE(
                    (SELECT SUM(amount) FROM payment_records WHERE invoice_id = i.id),
                    0
                ) as total_paid
            FROM invoices i
            LEFT JOIN tenants t ON i.tenant_id = t.id
            LEFT JOIN events e ON i.event_id = e.id
            ${whereSQL}
        `, ...params);

        // Calculate revenue by month
        const revenueByMonth = calculateRevenueByMonth(invoices, startDate, now);

        // Calculate revenue by company
        const revenueByCompany = calculateRevenueByCompany(invoices);

        // Calculate revenue by type
        const revenueByType = calculateRevenueByType(invoices);

        // Calculate revenue by status
        const revenueByStatus = calculateRevenueByStatus(invoices);

        // Get top vendors
        const topVendors = calculateTopVendors(invoices);

        // Calculate summary
        const totalRevenue = invoices
            .filter(inv => inv.status === "PAID")
            .reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);

        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter(inv => inv.status === "PAID").length;
        const averageInvoice = totalInvoices > 0 ? totalRevenue / paidInvoices : 0;

        const pendingAmount = invoices
            .filter(inv => inv.status === "PENDING" || inv.status === "SENT")
            .reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);

        const overdueAmount = invoices
            .filter(inv => {
                if (inv.status === "PAID") return false;
                return new Date(inv.due_date) < new Date();
            })
            .reduce((sum, inv) => sum + parseFloat(inv.grand_total || 0), 0);

        return NextResponse.json({
            revenueByMonth,
            revenueByCompany,
            revenueByType,
            revenueByStatus,
            topVendors,
            summary: {
                totalRevenue,
                averageInvoice,
                totalInvoices,
                paidInvoices,
                pendingAmount,
                overdueAmount
            }
        });
    } catch (error: any) {
        console.error("Failed to generate reports:", error);
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}

function calculateRevenueByMonth(invoices: any[], startDate: Date, endDate: Date) {
    const monthlyData: Record<string, { revenue: number; invoices: number }> = {};

    // Initialize months
    const current = new Date(startDate);
    while (current <= endDate) {
        const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = { revenue: 0, invoices: 0 };
        current.setMonth(current.getMonth() + 1);
    }

    // Aggregate data
    invoices.forEach(inv => {
        if (inv.status === "PAID") {
            const date = new Date(inv.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key]) {
                monthlyData[key].revenue += parseFloat(inv.grand_total || 0);
                monthlyData[key].invoices += 1;
            }
        }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: data.revenue,
        invoices: data.invoices
    }));
}

function calculateRevenueByCompany(invoices: any[]) {
    const companyData: Record<string, number> = {};
    let totalRevenue = 0;

    invoices.forEach(inv => {
        if (inv.status === "PAID") {
            const companyName = inv.tenant_name || "Unknown";
            const revenue = parseFloat(inv.grand_total || 0);
            companyData[companyName] = (companyData[companyName] || 0) + revenue;
            totalRevenue += revenue;
        }
    });

    return Object.entries(companyData)
        .map(([name, revenue]) => ({
            name,
            revenue,
            percentage: Math.round((revenue / totalRevenue) * 100)
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
}

function calculateRevenueByType(invoices: any[]) {
    const typeData: Record<string, { revenue: number; count: number }> = {};

    invoices.forEach(inv => {
        if (inv.status === "PAID") {
            const type = inv.recipient_type || "OTHER";
            if (!typeData[type]) {
                typeData[type] = { revenue: 0, count: 0 };
            }
            typeData[type].revenue += parseFloat(inv.grand_total || 0);
            typeData[type].count += 1;
        }
    });

    return Object.entries(typeData).map(([type, data]) => ({
        type,
        revenue: data.revenue,
        count: data.count
    }));
}

function calculateRevenueByStatus(invoices: any[]) {
    const statusData: Record<string, { amount: number; count: number }> = {};

    invoices.forEach(inv => {
        const status = inv.status;
        if (!statusData[status]) {
            statusData[status] = { amount: 0, count: 0 };
        }
        statusData[status].amount += parseFloat(inv.grand_total || 0);
        statusData[status].count += 1;
    });

    return Object.entries(statusData).map(([status, data]) => ({
        status,
        amount: data.amount,
        count: data.count
    }));
}

function calculateTopVendors(invoices: any[]) {
    const vendorData: Record<string, { totalPaid: number; invoiceCount: number }> = {};

    invoices.forEach(inv => {
        if (inv.status === "PAID") {
            const name = inv.recipient_name || "Unknown";
            if (!vendorData[name]) {
                vendorData[name] = { totalPaid: 0, invoiceCount: 0 };
            }
            vendorData[name].totalPaid += parseFloat(inv.grand_total || 0);
            vendorData[name].invoiceCount += 1;
        }
    });

    return Object.entries(vendorData)
        .map(([name, data]) => ({
            name,
            totalPaid: data.totalPaid,
            invoiceCount: data.invoiceCount
        }))
        .sort((a, b) => b.totalPaid - a.totalPaid)
        .slice(0, 10);
}
