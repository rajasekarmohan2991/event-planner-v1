import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/finance/purchase-orders
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const tenantId = user.currentTenantId;

    try {
        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: { tenantId },
            include: { event: { select: { name: true } }, items: true, vendor: true },
            orderBy: { createdAt: 'desc' }
        });

        const responseData = JSON.parse(JSON.stringify(purchaseOrders, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json({ purchaseOrders: responseData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/finance/purchase-orders
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const tenantId = user.currentTenantId;

    try {
        const body = await req.json();
        const { eventId, date, vendorId, vendorName, items, currency, notes, terms } = body;

        // Generate Number
        const count = await prisma.purchaseOrder.count({ where: { tenantId } });
        const number = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        // Calculate Totals
        let subtotal = 0;
        let taxTotal = 0; // PO might just have total

        const preparedItems = items.map((item: any) => {
            const itemTotal = item.quantity * item.unitPrice;
            subtotal += itemTotal;
            return {
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: itemTotal
            };
        });

        // Assuming tax is calculated at Bill stage usually, but let's allow basic tax here if needed or just subtotal
        // The schema has taxTotal
        taxTotal = body.taxTotal || 0;
        const grandTotal = subtotal + taxTotal;

        const purchaseOrder = await prisma.purchaseOrder.create({
            data: {
                tenantId,
                eventId: eventId ? BigInt(eventId) : null,
                number,
                date: new Date(date),
                vendorId: vendorId || null,
                vendorName,
                vendorEmail: body.vendorEmail,
                vendorAddress: body.vendorAddress,
                currency: currency || "USD",
                subtotal,
                taxTotal,
                grandTotal,
                notes,
                terms,
                items: {
                    create: preparedItems
                }
            }
        });

        const responseData = JSON.parse(JSON.stringify(purchaseOrder, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error("Create PO Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
