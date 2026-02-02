import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenantId = (session.user as any).currentTenantId;
        if (!tenantId) {
            return NextResponse.json({ error: "No tenant context" }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const type = searchParams.get("type");
        const eventId = searchParams.get("eventId");

        let query = `
            SELECT 
                c.id, c.tenant_id as "tenantId", c.event_id as "eventId",
                c.type, c.description, c.amount, c.currency, c.status,
                c.applied_date as "appliedDate", c.invoice_id as "invoiceId",
                c.notes, c.created_at as "createdAt", c.updated_at as "updatedAt",
                e.name as "eventName"
            FROM charges c
            LEFT JOIN events e ON c.event_id = e.id
            WHERE c.tenant_id = $1
        `;
        
        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (status) {
            query += ` AND c.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (type) {
            query += ` AND c.type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (eventId) {
            query += ` AND c.event_id = $${paramIndex}`;
            params.push(eventId);
            paramIndex++;
        }

        query += ` ORDER BY c.created_at DESC`;

        const charges = await prisma.$queryRawUnsafe(query, ...params);

        return NextResponse.json({ charges });
    } catch (error: any) {
        console.error("❌ [CHARGES] Failed to fetch charges:", error);
        
        if (error.message?.includes('relation "charges" does not exist')) {
            return NextResponse.json({ charges: [] });
        }
        
        return NextResponse.json({ 
            error: "Failed to fetch charges", 
            details: error.message 
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenantId = (session.user as any).currentTenantId;
        if (!tenantId) {
            return NextResponse.json({ error: "No tenant context" }, { status: 400 });
        }

        const body = await req.json();
        const {
            eventId,
            type,
            description,
            amount,
            currency = "USD",
            invoiceId,
            notes
        } = body;

        if (!type || !description || !amount) {
            return NextResponse.json({ 
                error: "Missing required fields: type, description, amount" 
            }, { status: 400 });
        }

        const chargeId = `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await prisma.$executeRawUnsafe(`
            INSERT INTO charges (
                id, tenant_id, event_id, type, description, amount,
                currency, status, invoice_id, notes, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
            )
        `,
            chargeId, tenantId, eventId || null, type, description, amount,
            currency, 'PENDING', invoiceId, notes
        );

        return NextResponse.json({ 
            success: true, 
            chargeId,
            message: "Charge created successfully" 
        });
    } catch (error: any) {
        console.error("❌ [CHARGES] Failed to create charge:", error);
        
        if (error.message?.includes('relation "charges" does not exist')) {
            return NextResponse.json({ 
                error: "Charges feature not yet configured.",
                details: "Database tables need to be created"
            }, { status: 503 });
        }
        
        return NextResponse.json({ 
            error: "Failed to create charge", 
            details: error.message 
        }, { status: 500 });
    }
}
