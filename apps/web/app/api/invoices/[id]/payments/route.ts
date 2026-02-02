import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/invoices/[id]/payments - Record a payment
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = 'then' in context.params ? await context.params : context.params;
    const { id: invoiceId } = params;

    try {
        const body = await req.json();
        const { amount, method, reference, date, notes } = body;

        // Get invoice
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        // Calculate total paid
        const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0) + amount;
        const balanceDue = invoice.grandTotal - totalPaid;

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                invoiceId,
                amount,
                method,
                reference,
                date: date ? new Date(date) : new Date(),
                status: "SUCCESS",
                notes
            }
        });

        // Generate receipt
        const receiptCount = await prisma.receipt.count({ where: { invoiceId } });
        const receiptNumber = `REC-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(4, '0')}`;

        const receipt = await prisma.receipt.create({
            data: {
                invoiceId,
                paymentId: payment.id,
                number: receiptNumber,
                amountPaid: amount,
                balanceDue: Math.max(0, balanceDue),
                paymentMethod: method
            }
        });

        // Update invoice status
        let newStatus = invoice.status;
        if (balanceDue <= 0) {
            newStatus = "PAID";
        } else if (totalPaid > 0) {
            newStatus = "PARTIAL";
        }

        await prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: newStatus }
        });

        return NextResponse.json({
            success: true,
            payment,
            receipt,
            balanceDue: Math.max(0, balanceDue)
        });
    } catch (error) {
        console.error("Failed to record payment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
