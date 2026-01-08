import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/invoices/[id] - Get single invoice
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = 'then' in context.params ? await context.params : context.params;
    const { id } = params;

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                items: true,
                payments: {
                    include: { receipt: true },
                    orderBy: { createdAt: "desc" }
                },
                receipts: true,
                event: true,
                tenant: {
                    select: {
                        name: true,
                        digitalSignatureUrl: true,
                        logo: true
                    }
                }
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        return NextResponse.json({ invoice });
    } catch (error) {
        console.error("Failed to fetch invoice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH /api/invoices/[id] - Update invoice
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = 'then' in context.params ? await context.params : context.params;
    const { id } = params;

    try {
        const body = await req.json();
        const { status, notes, terms } = body;

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                status,
                notes,
                terms
            },
            include: {
                items: true,
                payments: true
            }
        });

        return NextResponse.json({ success: true, invoice: updated });
    } catch (error) {
        console.error("Failed to update invoice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/invoices/[id] - Delete invoice (only if DRAFT)
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = 'then' in context.params ? await context.params : context.params;
    const { id } = params;

    try {
        const invoice = await prisma.invoice.findUnique({ where: { id } });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        if (invoice.status !== "DRAFT") {
            return NextResponse.json({
                error: "Only draft invoices can be deleted"
            }, { status: 400 });
        }

        await prisma.invoice.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete invoice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
