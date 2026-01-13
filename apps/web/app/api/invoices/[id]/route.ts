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
        // Fetch invoice using raw SQL with template literals
        const invoices = await prisma.$queryRaw<any[]>`
            SELECT 
                i.*,
                t.name as tenant_name,
                t.logo as tenant_logo,
                e.name as event_name
            FROM invoices i
            LEFT JOIN tenants t ON i.tenant_id = t.id
            LEFT JOIN events e ON i.event_id = e.id
            WHERE i.id = ${id}
        `;

        if (invoices.length === 0) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        const invoice = invoices[0];

        // Fetch line items
        const items = await prisma.$queryRaw<any[]>`
            SELECT * FROM invoice_line_items WHERE invoice_id = ${id} ORDER BY id
        `;

        // Fetch payments
        const payments = await prisma.$queryRaw<any[]>`
            SELECT * FROM payment_records WHERE invoice_id = ${id} ORDER BY created_at DESC
        `;

        // Fetch receipts
        const receipts = await prisma.$queryRaw<any[]>`
            SELECT * FROM receipts WHERE invoice_id = ${id}
        `;

        // Map snake_case to camelCase for frontend
        const mappedInvoice = {
            id: invoice.id,
            number: invoice.number,
            date: invoice.date,
            dueDate: invoice.due_date,
            recipientType: invoice.recipient_type,
            recipientName: invoice.recipient_name,
            recipientEmail: invoice.recipient_email,
            recipientAddress: invoice.recipient_address,
            recipientTaxId: invoice.recipient_tax_id,
            status: invoice.status,
            currency: invoice.currency || 'USD',
            subtotal: parseFloat(invoice.subtotal || 0),
            taxTotal: parseFloat(invoice.tax_total || 0),
            discountTotal: parseFloat(invoice.discount_total || 0),
            grandTotal: parseFloat(invoice.grand_total || 0),
            notes: invoice.notes,
            terms: invoice.terms,
            isSigned: invoice.is_signed,
            signatureUrl: invoice.signature_url,
            tenantId: invoice.tenant_id,
            eventId: invoice.event_id,
            event: invoice.event_name ? { id: invoice.event_id, name: invoice.event_name } : null,
            tenant: invoice.tenant_name ? { name: invoice.tenant_name, logo: invoice.tenant_logo } : null,
            items: items.map((item: any) => ({
                id: item.id,
                description: item.description,
                quantity: parseFloat(item.quantity || 0),
                unitPrice: parseFloat(item.unit_price || 0),
                taxRate: parseFloat(item.tax_rate || 0),
                total: parseFloat(item.total || 0)
            })),
            payments: payments.map((p: any) => ({
                id: p.id,
                amount: parseFloat(p.amount || 0),
                method: p.method,
                date: p.created_at,
                receipt: p.receipt_number ? { number: p.receipt_number } : null
            })),
            receipts: receipts
        };

        return NextResponse.json({ invoice: mappedInvoice });
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

        // Update using raw SQL with template literals
        await prisma.$executeRaw`
            UPDATE invoices 
            SET status = ${status}, notes = ${notes}, terms = ${terms}, updated_at = NOW()
            WHERE id = ${id}
        `;

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
