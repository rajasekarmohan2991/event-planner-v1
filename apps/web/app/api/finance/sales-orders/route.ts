import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/finance/sales-orders
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const tenantId = user.currentTenantId;

    try {
        const salesOrders = await prisma.salesOrder.findMany({
            where: { tenantId },
            include: { event: { select: { name: true } }, items: true },
            orderBy: { createdAt: 'desc' }
        });

        // Serialize BigInt
        const responseData = JSON.parse(JSON.stringify(salesOrders, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json({ salesOrders: responseData });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/finance/sales-orders
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const tenantId = user.currentTenantId;

    try {
        const body = await req.json();
        const { eventId, date, customerName, items, currency, notes, terms } = body;

        // Generate Number
        const count = await prisma.salesOrder.count({ where: { tenantId } });
        const number = `SO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        // Calculate Totals
        let subtotal = 0;
        let taxTotal = 0;
        let discountTotal = 0;

        const preparedItems = items.map((item: any) => {
            const itemTotal = item.quantity * item.unitPrice;
            const itemTax = (itemTotal * (item.taxRate || 0)) / 100;

            subtotal += itemTotal;
            taxTotal += itemTax;
            discountTotal += item.discount || 0;

            return {
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate || 0,
                taxAmount: itemTax,
                discount: item.discount || 0,
                total: itemTotal + itemTax - (item.discount || 0)
            };
        });

        const grandTotal = subtotal + taxTotal - discountTotal;

        let salesOrder;
        try {
            salesOrder = await prisma.salesOrder.create({
                data: {
                    tenantId,
                    eventId: eventId ? BigInt(eventId) : null,
                    number,
                    date: new Date(date),
                    customerName,
                    customerType: body.customerType,
                    customerEmail: body.customerEmail,
                    // @ts-ignore: Fields might not exist in generated client yet
                    customerAddress: body.customerAddress,
                    // @ts-ignore
                    customerPhone: body.customerPhone,
                    currency: currency || "USD",
                    subtotal,
                    taxTotal,
                    discountTotal,
                    grandTotal,
                    notes,
                    terms,
                    items: {
                        create: preparedItems
                    }
                }
            });
        } catch (dbError: any) {
            console.error("Create SO with extended fields failed, retrying without them:", dbError.message);
            // Fallback: Try creating without new fields (in case DB schema isn't updated)
            salesOrder = await prisma.salesOrder.create({
                data: {
                    tenantId,
                    eventId: eventId ? BigInt(eventId) : null,
                    number,
                    date: new Date(date),
                    customerName,
                    customerType: body.customerType,
                    customerEmail: body.customerEmail,
                    // Skip new fields
                    currency: currency || "USD",
                    subtotal,
                    taxTotal,
                    discountTotal,
                    grandTotal,
                    notes,
                    terms,
                    items: {
                        create: preparedItems
                    }
                }
            });
        }

        // Serialize BigInt
        const responseData = JSON.parse(JSON.stringify(salesOrder, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error("Create SO Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
