import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/finance/bills
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const tenantId = user.currentTenantId;

    try {
        const bills = await prisma.bill.findMany({
            where: { tenantId },
            include: { event: { select: { name: true } }, items: true, vendor: true },
            orderBy: { createdAt: 'desc' }
        });

        const responseData = JSON.parse(JSON.stringify(bills, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json({ bills: responseData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/finance/bills
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const tenantId = user.currentTenantId;

    try {
        const body = await req.json();
        const { eventId, date, dueDate, vendorId, vendorName, items, currency, purchaseOrderId, vendorInvoiceNumber } = body;

        // Generate Number
        const count = await prisma.bill.count({ where: { tenantId } });
        const number = `BILL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        // Calculate Totals
        let totalAmount = 0;

        const preparedItems = items.map((item: any) => {
            const itemTotal = item.quantity * item.unitPrice;
            totalAmount += itemTotal;
            return {
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: itemTotal
            };
        });

        // Add manual tax amount if provided
        const taxAmount = body.taxAmount || 0;
        totalAmount += taxAmount;

        const bill = await prisma.bill.create({
            data: {
                tenantId,
                eventId: eventId ? BigInt(eventId) : null,
                number,
                vendorInvoiceNumber,
                purchaseOrderId: purchaseOrderId || null,
                date: new Date(date),
                dueDate: new Date(dueDate),
                vendorId: vendorId || null,
                vendorName,
                currency: currency || "USD",
                amount: totalAmount - taxAmount, // Base amount
                taxAmount,
                totalAmount,
                amountPaid: 0,
                notes: body.notes,
                items: {
                    create: preparedItems
                }
            }
        });

        const responseData = JSON.parse(JSON.stringify(bill, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error("Create Bill Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
