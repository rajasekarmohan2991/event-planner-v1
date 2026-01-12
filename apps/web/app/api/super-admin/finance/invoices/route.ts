import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureSchema } from "@/lib/ensure-schema";

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
        const invoices = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                i.id, i.number, i.recipient_type, i.recipient_name, i.recipient_email,
                i.grand_total, i.status, i.due_date, i.created_at, i.currency,
                i.tenant_id, t.name as tenant_name,
                i.event_id, e.name as event_name,
                COALESCE(
                    (SELECT SUM(amount) FROM payment_records WHERE invoice_id = i.id),
                    0
                ) as total_paid
            FROM invoices i
            LEFT JOIN tenants t ON i.tenant_id = t.id
            LEFT JOIN events e ON i.event_id = e.id
            ORDER BY i.created_at DESC
        `);

        // Transform for frontend
        const transformedInvoices = invoices.map(inv => {
            const grandTotal = parseFloat(inv.grand_total || 0);
            const totalPaid = parseFloat(inv.total_paid || 0);
            
            // Determine status
            let status = inv.status;
            if (status !== "PAID" && new Date(inv.due_date) < new Date()) {
                status = "OVERDUE";
            } else if (totalPaid >= grandTotal) {
                status = "PAID";
            } else if (totalPaid > 0) {
                status = "PARTIAL";
            } else if (status === "SENT") {
                status = "PENDING";
            }

            return {
                id: inv.id,
                number: inv.number,
                recipientType: inv.recipient_type,
                recipientName: inv.recipient_name,
                recipientEmail: inv.recipient_email,
                companyId: inv.tenant_id,
                companyName: inv.tenant_name || "Unknown",
                eventId: inv.event_id?.toString() || null,
                eventName: inv.event_name || "No Event",
                amount: grandTotal,
                status,
                dueDate: new Date(inv.due_date).toISOString(),
                createdAt: new Date(inv.created_at).toISOString(),
                currency: inv.currency
            };
        });

        return NextResponse.json({ invoices: transformedInvoices });
    } catch (error: any) {
        console.error("Failed to fetch invoices:", error);
        
        // If table doesn't exist, create it and return empty array
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            console.warn('⚠️ Invoices table does not exist, running schema healing...');
            try {
                await ensureSchema();
                return NextResponse.json({ invoices: [] });
            } catch (schemaError) {
                console.error('Schema healing failed:', schemaError);
                return NextResponse.json({ invoices: [] });
            }
        }
        
        return NextResponse.json({ 
            error: "Internal Server Error",
            details: error.message,
            invoices: []
        }, { status: 500 });
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
