import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/finance/tds - List TDS deductions
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = session.user as any;
        const searchParams = req.nextUrl.searchParams;
        const tenantId = searchParams.get('tenantId') || user.currentTenantId;
        const eventId = searchParams.get('eventId');
        const status = searchParams.get('status');
        const financialYear = searchParams.get('financialYear');
        const quarter = searchParams.get('quarter');
        const recipientType = searchParams.get('recipientType');

        let whereClause = `WHERE tenant_id = $1`;
        const params: any[] = [tenantId];
        let paramIndex = 2;

        if (eventId) {
            whereClause += ` AND event_id = $${paramIndex}`;
            params.push(BigInt(eventId));
            paramIndex++;
        }

        if (status) {
            whereClause += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (financialYear) {
            whereClause += ` AND financial_year = $${paramIndex}`;
            params.push(financialYear);
            paramIndex++;
        }

        if (quarter) {
            whereClause += ` AND quarter = $${paramIndex}`;
            params.push(quarter);
            paramIndex++;
        }

        if (recipientType) {
            whereClause += ` AND recipient_type = $${paramIndex}`;
            params.push(recipientType);
            paramIndex++;
        }

        const deductions = await prisma.$queryRawUnsafe(`
            SELECT 
                id,
                tenant_id as "tenantId",
                event_id as "eventId",
                payout_id as "payoutId",
                recipient_type as "recipientType",
                recipient_id as "recipientId",
                recipient_name as "recipientName",
                recipient_pan as "recipientPan",
                section,
                tds_rate as "tdsRate",
                gross_amount as "grossAmount",
                tds_amount as "tdsAmount",
                net_amount as "netAmount",
                currency,
                status,
                deducted_at as "deductedAt",
                deposited_at as "depositedAt",
                certificate_number as "certificateNumber",
                certificate_issued_at as "certificateIssuedAt",
                financial_year as "financialYear",
                quarter,
                notes,
                created_at as "createdAt"
            FROM tds_deductions
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT 100
        `, ...params);

        // Calculate summary
        const summary = await prisma.$queryRawUnsafe(`
            SELECT 
                COUNT(*) as total_count,
                COALESCE(SUM(gross_amount), 0) as total_gross,
                COALESCE(SUM(tds_amount), 0) as total_tds,
                COALESCE(SUM(net_amount), 0) as total_net,
                COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'DEDUCTED' THEN 1 END) as deducted_count,
                COUNT(CASE WHEN status = 'DEPOSITED' THEN 1 END) as deposited_count
            FROM tds_deductions
            ${whereClause}
        `, ...params);

        return NextResponse.json({ 
            deductions,
            summary: (summary as any[])[0] || {}
        });
    } catch (error: any) {
        console.error('Error fetching TDS deductions:', error);
        
        if (error.message?.includes('does not exist')) {
            return NextResponse.json({ deductions: [], summary: {} });
        }
        
        return NextResponse.json({ 
            error: 'Failed to fetch TDS deductions',
            details: error.message 
        }, { status: 500 });
    }
}

// POST /api/finance/tds - Create TDS deduction record
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = session.user as any;
        const body = await req.json();
        const {
            tenantId,
            eventId,
            payoutId,
            recipientType,
            recipientId,
            recipientName,
            recipientPan,
            section,
            tdsRate = 10,
            grossAmount,
            currency = 'INR',
            notes
        } = body;

        const finalTenantId = tenantId || user.currentTenantId;

        // Validate required fields
        if (!recipientType || !recipientName || !grossAmount) {
            return NextResponse.json({ 
                error: 'Missing required fields',
                details: 'recipientType, recipientName, and grossAmount are required'
            }, { status: 400 });
        }

        // Calculate TDS and net amounts
        const tdsAmount = (grossAmount * tdsRate) / 100;
        const netAmount = grossAmount - tdsAmount;

        // Determine financial year and quarter
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const year = now.getFullYear();
        
        // Indian financial year: April to March
        let financialYear: string;
        let quarter: string;
        
        if (month >= 4) {
            financialYear = `${year}-${(year + 1).toString().slice(-2)}`;
        } else {
            financialYear = `${year - 1}-${year.toString().slice(-2)}`;
        }
        
        if (month >= 4 && month <= 6) quarter = 'Q1';
        else if (month >= 7 && month <= 9) quarter = 'Q2';
        else if (month >= 10 && month <= 12) quarter = 'Q3';
        else quarter = 'Q4';

        const id = `tds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await prisma.$executeRawUnsafe(`
            INSERT INTO tds_deductions (
                id, tenant_id, event_id, payout_id,
                recipient_type, recipient_id, recipient_name, recipient_pan,
                section, tds_rate, gross_amount, tds_amount, net_amount,
                currency, status, financial_year, quarter, notes,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
            )
        `,
            id,
            finalTenantId,
            eventId ? BigInt(eventId) : null,
            payoutId || null,
            recipientType,
            recipientId || null,
            recipientName,
            recipientPan || null,
            section || '194J', // Default section for professional services
            tdsRate,
            grossAmount,
            tdsAmount,
            netAmount,
            currency,
            'PENDING',
            financialYear,
            quarter,
            notes || null
        );

        return NextResponse.json({
            success: true,
            tds: {
                id,
                recipientType,
                recipientName,
                grossAmount,
                tdsRate,
                tdsAmount,
                netAmount,
                currency,
                financialYear,
                quarter,
                status: 'PENDING'
            }
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating TDS deduction:', error);
        return NextResponse.json({ 
            error: 'Failed to create TDS deduction',
            details: error.message 
        }, { status: 500 });
    }
}
