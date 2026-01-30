import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const tenantId = user.currentTenantId;

    try {
        const salesOrder = await prisma.salesOrder.findFirst({
            where: {
                id: params.id,
                tenantId
            },
            include: {
                tenant: { select: { name: true, logo: true } },
                items: true
            }
        });

        if (!salesOrder) {
            return NextResponse.json({ error: "Sales Order not found" }, { status: 404 });
        }

        // Serialize BigInt
        const responseData = JSON.parse(JSON.stringify(salesOrder, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return NextResponse.json(responseData);
    } catch (error: any) {
        console.error("Fetch SO Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const tenantId = user.currentTenantId;

    try {
        await prisma.salesOrder.deleteMany({
            where: { id: params.id, tenantId }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete SO Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const tenantId = user.currentTenantId;

    try {
        const body = await req.json();
        const { date, customerName, customerEmail, customerPhone, customerAddress, items, notes, terms, currency } = body;

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

        // Update using transaction to replace items
        const salesOrder = await prisma.$transaction(async (tx) => {
            await tx.salesOrderItem.deleteMany({ where: { salesOrderId: params.id } });

            return tx.salesOrder.update({
                where: { id: params.id, tenantId },
                data: {
                    date: new Date(date),
                    customerName,
                    customerEmail,
                    customerPhone,
                    customerAddress,
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
        });

        return NextResponse.json(salesOrder);
    } catch (error: any) {
        console.error("Update SO Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
