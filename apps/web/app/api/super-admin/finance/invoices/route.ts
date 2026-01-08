import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/super-admin/finance/invoices - Get all invoices across all companies
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
        const invoices = await prisma.invoice.findMany({
            include: {
                tenant: {
                    select: { id: true, name: true }
                },
                event: {
                    select: { id: true, name: true }
                },
                payments: true,
                items: true
            },
            orderBy: { createdAt: "desc" }
        });

        // Transform for frontend
        const transformedInvoices = invoices.map(inv => ({
            id: inv.id,
            number: inv.number,
            recipientType: inv.recipientType,
            recipientName: inv.recipientName,
            recipientEmail: inv.recipientEmail,
            companyId: inv.tenant.id,
            companyName: inv.tenant.name,
            eventId: inv.event?.id?.toString() || null,
            eventName: inv.event?.name || "No Event",
            amount: inv.grandTotal,
            status: determineStatus(inv),
            dueDate: inv.dueDate.toISOString(),
            createdAt: inv.createdAt.toISOString(),
            currency: inv.currency
        }));

        return NextResponse.json({ invoices: transformedInvoices });
    } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

function determineStatus(invoice: any): string {
    // Check if overdue
    if (invoice.status !== "PAID" && new Date(invoice.dueDate) < new Date()) {
        return "OVERDUE";
    }

    // Check payment status
    const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + p.amount, 0);

    if (totalPaid >= invoice.grandTotal) {
        return "PAID";
    } else if (totalPaid > 0) {
        return "PARTIAL";
    } else if (invoice.status === "SENT") {
        return "PENDING";
    }

    return invoice.status;
}
