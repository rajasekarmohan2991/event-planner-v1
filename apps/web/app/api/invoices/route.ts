import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/invoices - List all invoices for current tenant
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.currentTenantId;

    if (!tenantId) {
        return NextResponse.json({ error: "No tenant context" }, { status: 400 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const recipientType = searchParams.get("recipientType");
        const eventId = searchParams.get("eventId");

        const where: any = { tenantId };

        if (status) where.status = status;
        if (recipientType) where.recipientType = recipientType;
        if (eventId) where.eventId = BigInt(eventId);

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                items: true,
                payments: true,
                receipts: true,
                event: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ invoices });
    } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/invoices - Create new invoice
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.currentTenantId;

    if (!tenantId) {
        return NextResponse.json({ error: "No tenant context" }, { status: 400 });
    }

    try {
        const body = await req.json();
        const {
            eventId,
            recipientType,
            recipientId,
            recipientName,
            recipientEmail,
            recipientAddress,
            recipientTaxId,
            date,
            dueDate,
            currency,
            items,
            notes,
            terms,
            isSigned,
            signatureUrl
        } = body;

        // Calculate totals
        let subtotal = 0;
        let taxTotal = 0;
        let discountTotal = 0;

        const lineItems = items.map((item: any) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemTax = (itemSubtotal * item.taxRate) / 100;
            const itemTotal = itemSubtotal + itemTax - (item.discount || 0);

            subtotal += itemSubtotal;
            taxTotal += itemTax;
            discountTotal += item.discount || 0;

            return {
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate || 0,
                taxAmount: itemTax,
                discount: item.discount || 0,
                total: itemTotal
            };
        });

        const grandTotal = subtotal + taxTotal - discountTotal;

        // Generate invoice number
        const count = await prisma.invoice.count({ where: { tenantId } });
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        // Create invoice with line items
        const invoice = await prisma.invoice.create({
            data: {
                tenantId,
                eventId: eventId ? BigInt(eventId) : null,
                number: invoiceNumber,
                date: new Date(date),
                dueDate: new Date(dueDate),
                recipientType,
                recipientId,
                recipientName,
                recipientEmail,
                recipientAddress,
                recipientTaxId,
                currency: currency || "USD",
                status: "DRAFT",
                subtotal,
                taxTotal,
                discountTotal,
                grandTotal,
                notes,
                terms,
                isSigned: isSigned || false,
                signatureUrl,
                items: {
                    create: lineItems
                }
            },
            include: {
                items: true,
                event: true
            }
        });

        return NextResponse.json({ success: true, invoice });
    } catch (error) {
        console.error("Failed to create invoice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
