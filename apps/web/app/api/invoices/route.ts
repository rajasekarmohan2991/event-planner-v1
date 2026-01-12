import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureSchema } from "@/lib/ensure-schema";

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

        // Use raw SQL query for reliability
        let query = `
            SELECT 
                i.id, i.tenant_id as "tenantId", i.event_id as "eventId",
                i.number, i.date, i.due_date as "dueDate",
                i.recipient_type as "recipientType", i.recipient_id as "recipientId",
                i.recipient_name as "recipientName", i.recipient_email as "recipientEmail",
                i.status, i.currency, i.subtotal, i.tax_total as "taxTotal",
                i.discount_total as "discountTotal", i.grand_total as "grandTotal",
                i.created_at as "createdAt", i.updated_at as "updatedAt",
                e.name as "eventName"
            FROM invoices i
            LEFT JOIN events e ON i.event_id = e.id
            WHERE i.tenant_id = $1
        `;
        
        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (status) {
            query += ` AND i.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (recipientType) {
            query += ` AND i.recipient_type = $${paramIndex}`;
            params.push(recipientType);
            paramIndex++;
        }

        if (eventId) {
            query += ` AND i.event_id = $${paramIndex}`;
            params.push(eventId);
            paramIndex++;
        }

        query += ` ORDER BY i.created_at DESC`;

        const invoices = await prisma.$queryRawUnsafe(query, ...params);

        return NextResponse.json({ invoices });
    } catch (error: any) {
        console.error("❌ [INVOICES] Failed to fetch invoices:", error);
        console.error("❌ [INVOICES] Error details:", error.message);
        
        // If table doesn't exist, create it and return empty array
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            console.warn("⚠️ [INVOICES] Table does not exist, running schema healing...");
            try {
                await ensureSchema();
                return NextResponse.json({ invoices: [] });
            } catch (schemaError) {
                console.error("❌ Schema healing failed:", schemaError);
                return NextResponse.json({ invoices: [] });
            }
        }
        
        return NextResponse.json({ 
            error: "Failed to fetch invoices", 
            details: error.message 
        }, { status: 500 });
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
        const countResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT COUNT(*) as count FROM invoices WHERE tenant_id = $1`,
            tenantId
        );
        const count = parseInt(countResult[0]?.count || '0');
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        // Create invoice using raw SQL
        const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Convert eventId to BigInt if provided
        const eventIdBigInt = eventId ? BigInt(eventId) : null;
        
        await prisma.$executeRawUnsafe(`
            INSERT INTO invoices (
                id, tenant_id, event_id, number, date, due_date,
                recipient_type, recipient_id, recipient_name, recipient_email,
                recipient_address, recipient_tax_id, currency, status,
                subtotal, tax_total, discount_total, grand_total,
                notes, terms, is_signed, signature_url,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18,
                $19, $20, $21, $22, NOW(), NOW()
            )
        `,
            invoiceId, tenantId, eventIdBigInt, invoiceNumber,
            new Date(date), new Date(dueDate),
            recipientType, recipientId || null, recipientName, recipientEmail,
            recipientAddress, recipientTaxId, currency || "USD", "DRAFT",
            subtotal, taxTotal, discountTotal, grandTotal,
            notes || null, terms || null, isSigned || false, signatureUrl || null
        );

        // Insert line items
        for (const item of lineItems) {
            const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await prisma.$executeRawUnsafe(`
                INSERT INTO invoice_line_items (
                    id, invoice_id, description, quantity, unit_price,
                    tax_rate, tax_amount, discount, total
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `,
                itemId, invoiceId, item.description, item.quantity, item.unitPrice,
                item.taxRate, item.taxAmount, item.discount, item.total
            );
        }

        // Generate PDF URL
        const baseUrl = process.env.NEXTAUTH_URL || 'https://aypheneventplanner.vercel.app';
        const pdfUrl = `${baseUrl}/api/finance/invoices/${invoiceId}/pdf`;

        return NextResponse.json({ 
            success: true, 
            invoiceId, 
            invoiceNumber,
            pdfUrl,
            message: 'Invoice created successfully'
        });
    } catch (error: any) {
        console.error("❌ [INVOICES] Failed to create invoice:", error);
        console.error("❌ [INVOICES] Error details:", error.message);
        
        // If table doesn't exist, create it and retry
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            console.warn("⚠️ [INVOICES] Table does not exist, running schema healing...");
            try {
                await ensureSchema();
                return NextResponse.json({ 
                    error: "Database tables created. Please try again.",
                    needsRetry: true
                }, { status: 503 });
            } catch (schemaError) {
                console.error("❌ Schema healing failed:", schemaError);
            }
        }
        
        return NextResponse.json({ 
            error: "Failed to create invoice", 
            details: error.message 
        }, { status: 500 });
    }
}
