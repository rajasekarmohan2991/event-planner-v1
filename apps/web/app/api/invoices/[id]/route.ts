import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureSchema } from "@/lib/ensure-schema";

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
        // Fetch invoice using raw SQL
        const invoices = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                i.*,
                t.name as tenant_name,
                t.logo as tenant_logo,
                e.name as event_name
            FROM invoices i
            LEFT JOIN tenants t ON i.tenant_id = t.id
            LEFT JOIN events e ON i.event_id = e.id
            WHERE i.id = $1
        `, id);

        if (invoices.length === 0) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        const invoice = invoices[0];

        // Fetch line items
        const items = await prisma.$queryRawUnsafe<any[]>(`
            SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY id
        `, id);

        // Fetch payments
        const payments = await prisma.$queryRawUnsafe<any[]>(`
            SELECT * FROM payment_records WHERE invoice_id = $1 ORDER BY created_at DESC
        `, id);

        // Fetch receipts
        const receipts = await prisma.$queryRawUnsafe<any[]>(`
            SELECT * FROM receipts WHERE invoice_id = $1
        `, id);

        return NextResponse.json({ 
            invoice: {
                ...invoice,
                items,
                payments,
                receipts
            }
        });
    } catch (error: any) {
        console.error("Failed to fetch invoice:", error);
        
        // If table doesn't exist, create it
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            try {
                await ensureSchema();
                return NextResponse.json({ 
                    error: "Database tables created. Please refresh.",
                    needsRetry: true
                }, { status: 503 });
            } catch (schemaError) {
                console.error("Schema healing failed:", schemaError);
            }
        }
        
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
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

        // Update using raw SQL
        await prisma.$executeRawUnsafe(`
            UPDATE invoices 
            SET status = $1, notes = $2, terms = $3, updated_at = NOW()
            WHERE id = $4
        `, status, notes, terms, id);

        // Fetch updated invoice
        const invoices = await prisma.$queryRawUnsafe<any[]>(`
            SELECT * FROM invoices WHERE id = $1
        `, id);

        const items = await prisma.$queryRawUnsafe<any[]>(`
            SELECT * FROM invoice_line_items WHERE invoice_id = $1
        `, id);

        const payments = await prisma.$queryRawUnsafe<any[]>(`
            SELECT * FROM payment_records WHERE invoice_id = $1
        `, id);

        return NextResponse.json({ 
            success: true, 
            invoice: {
                ...invoices[0],
                items,
                payments
            }
        });
    } catch (error: any) {
        console.error("Failed to update invoice:", error);
        
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            try {
                await ensureSchema();
                return NextResponse.json({ 
                    error: "Database tables created. Please try again.",
                    needsRetry: true
                }, { status: 503 });
            } catch (schemaError) {
                console.error("Schema healing failed:", schemaError);
            }
        }
        
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
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
        // Check invoice status using raw SQL
        const invoices = await prisma.$queryRawUnsafe<any[]>(`
            SELECT status FROM invoices WHERE id = $1
        `, id);

        if (invoices.length === 0) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        if (invoices[0].status !== "DRAFT") {
            return NextResponse.json({
                error: "Only draft invoices can be deleted"
            }, { status: 400 });
        }

        // Delete invoice and related records using raw SQL
        await prisma.$executeRawUnsafe(`DELETE FROM invoice_line_items WHERE invoice_id = $1`, id);
        await prisma.$executeRawUnsafe(`DELETE FROM payment_records WHERE invoice_id = $1`, id);
        await prisma.$executeRawUnsafe(`DELETE FROM receipts WHERE invoice_id = $1`, id);
        await prisma.$executeRawUnsafe(`DELETE FROM invoices WHERE id = $1`, id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete invoice:", error);
        
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            try {
                await ensureSchema();
                return NextResponse.json({ 
                    error: "Database tables created. Please try again.",
                    needsRetry: true
                }, { status: 503 });
            } catch (schemaError) {
                console.error("Schema healing failed:", schemaError);
            }
        }
        
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
