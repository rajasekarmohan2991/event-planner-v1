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
