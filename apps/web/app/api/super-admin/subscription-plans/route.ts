import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/super-admin/subscription-plans - List all subscription plans
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const plans = await prisma.$queryRawUnsafe(`
            SELECT 
                id,
                name,
                slug,
                description,
                price,
                currency,
                billing_period as "billingPeriod",
                max_events as "maxEvents",
                max_users as "maxUsers",
                max_attendees as "maxAttendees",
                features,
                is_active as "isActive",
                sort_order as "sortOrder",
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM subscription_plans
            ORDER BY sort_order ASC, created_at DESC
        `);

        return NextResponse.json({ plans });
    } catch (error: any) {
        console.error('Error fetching subscription plans:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subscription plans', details: error.message },
            { status: 500 }
        );
    }
}

// POST /api/super-admin/subscription-plans - Create new subscription plan
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            name,
            slug,
            description,
            price,
            currency,
            billingPeriod,
            maxEvents,
            maxUsers,
            maxAttendees,
            features,
            isActive,
            sortOrder
        } = body;

        if (!name || !slug || price === undefined) {
            return NextResponse.json(
                { error: 'Name, slug, and price are required' },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const existing = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id FROM subscription_plans WHERE slug = $1
        `, slug);

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'A plan with this slug already exists' },
                { status: 400 }
            );
        }

        const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const featuresJson = JSON.stringify(features || []);

        await prisma.$executeRaw`
            INSERT INTO subscription_plans (
                id, name, slug, description, price, currency, billing_period,
                max_events, max_users, max_attendees, features, is_active, sort_order
            ) VALUES (
                ${planId}, ${name}, ${slug}, ${description || null}, ${price}, ${currency || 'USD'},
                ${billingPeriod || 'MONTHLY'}, ${maxEvents || null}, ${maxUsers || null},
                ${maxAttendees || null}, ${featuresJson}::jsonb, ${isActive !== false}, ${sortOrder || 0}
            )
        `;

        return NextResponse.json({
            message: 'Subscription plan created successfully',
            planId
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating subscription plan:', error);
        return NextResponse.json(
            { error: 'Failed to create subscription plan', details: error.message },
            { status: 500 }
        );
    }
}
