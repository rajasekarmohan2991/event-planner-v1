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
        const eventId = searchParams.get("eventId");
        const recipientType = searchParams.get("recipientType");

        let query = `
            SELECT 
                p.id, p.tenant_id as "tenantId", p.event_id as "eventId",
                p.recipient_type as "recipientType", p.recipient_id as "recipientId",
                p.recipient_name as "recipientName", p.recipient_email as "recipientEmail",
                p.bank_name as "bankName", p.account_number as "accountNumber",
                p.ifsc_code as "ifscCode", p.account_holder as "accountHolder",
                p.upi_id as "upiId", p.amount, p.currency, p.method, p.reference,
                p.status, p.scheduled_date as "scheduledDate", 
                p.processed_date as "processedDate", p.description, p.notes,
                p.created_at as "createdAt", p.updated_at as "updatedAt",
                e.name as "eventName"
            FROM payouts p
            LEFT JOIN events e ON p.event_id = e.id
            WHERE p.tenant_id = $1
        `;
        
        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (status) {
            query += ` AND p.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (recipientType) {
            query += ` AND p.recipient_type = $${paramIndex}`;
            params.push(recipientType);
            paramIndex++;
        }

        if (eventId) {
            query += ` AND p.event_id = $${paramIndex}`;
            params.push(eventId);
            paramIndex++;
        }

        query += ` ORDER BY p.created_at DESC`;

        const payouts = await prisma.$queryRawUnsafe(query, ...params);

        return NextResponse.json({ payouts });
    } catch (error: any) {
        console.error("❌ [PAYOUTS] Failed to fetch payouts:", error);
        
        if (error.message?.includes('relation "payouts" does not exist')) {
            console.warn("⚠️ [PAYOUTS] Payouts table does not exist, returning empty array");
            return NextResponse.json({ payouts: [] });
        }
        
        return NextResponse.json({ 
            error: "Failed to fetch payouts", 
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
            recipientType,
            recipientId,
            recipientName,
            recipientEmail,
            bankName,
            accountNumber,
            ifscCode,
            accountHolder,
            upiId,
            amount,
            currency = "USD",
            method,
            reference,
            scheduledDate,
            description,
            notes
        } = body;

        // Validation
        if (!recipientType || !recipientName || !amount || !method || !scheduledDate) {
            return NextResponse.json({ 
                error: "Missing required fields: recipientType, recipientName, amount, method, scheduledDate" 
            }, { status: 400 });
        }

        const payoutId = `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await prisma.$executeRawUnsafe(`
            INSERT INTO payouts (
                id, tenant_id, event_id, recipient_type, recipient_id,
                recipient_name, recipient_email, bank_name, account_number,
                ifsc_code, account_holder, upi_id, amount, currency,
                method, reference, status, scheduled_date, description, notes,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                NOW(), NOW()
            )
        `,
            payoutId, tenantId, eventId || null, recipientType, recipientId,
            recipientName, recipientEmail, bankName, accountNumber,
            ifscCode, accountHolder, upiId, amount, currency,
            method, reference, 'PENDING', new Date(scheduledDate), description, notes
        );

        return NextResponse.json({ 
            success: true, 
            payoutId,
            message: "Payout created successfully" 
        });
    } catch (error: any) {
        console.error("❌ [PAYOUTS] Failed to create payout:", error);
        
        if (error.message?.includes('relation "payouts" does not exist')) {
            return NextResponse.json({ 
                error: "Payouts feature not yet configured. Please contact administrator.",
                details: "Database tables need to be created"
            }, { status: 503 });
        }
        
        return NextResponse.json({ 
            error: "Failed to create payout", 
            details: error.message 
        }, { status: 500 });
    }
}
