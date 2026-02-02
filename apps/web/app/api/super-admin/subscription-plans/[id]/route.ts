import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PUT /api/super-admin/subscription-plans/[id] - Update subscription plan
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const planId = params.id;
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

        // Check if slug is taken by another plan
        const existing = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id FROM subscription_plans WHERE slug = $1 AND id != $2
        `, slug, planId);

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'A plan with this slug already exists' },
                { status: 400 }
            );
        }

        const featuresJson = JSON.stringify(features || []);

        await prisma.$executeRaw`
            UPDATE subscription_plans
            SET 
                name = ${name},
                slug = ${slug},
                description = ${description || null},
                price = ${price},
                currency = ${currency || 'USD'},
                billing_period = ${billingPeriod || 'MONTHLY'},
                max_events = ${maxEvents || null},
                max_users = ${maxUsers || null},
                max_attendees = ${maxAttendees || null},
                features = ${featuresJson}::jsonb,
                is_active = ${isActive !== false},
                sort_order = ${sortOrder || 0},
                updated_at = NOW()
            WHERE id = ${planId}
        `;

        return NextResponse.json({
            message: 'Subscription plan updated successfully'
        });
    } catch (error: any) {
        console.error('Error updating subscription plan:', error);
        return NextResponse.json(
            { error: 'Failed to update subscription plan', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE /api/super-admin/subscription-plans/[id] - Delete subscription plan
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions as any);
        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const planId = params.id;

        // Check if any tenants are using this plan
        const tenants = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id FROM tenants WHERE plan = (SELECT slug FROM subscription_plans WHERE id = $1)
        `, planId);

        if (tenants.length > 0) {
            return NextResponse.json(
                { error: `Cannot delete plan: ${tenants.length} companies are currently using it` },
                { status: 400 }
            );
        }

        await prisma.$executeRaw`
            DELETE FROM subscription_plans WHERE id = ${planId}
        `;

        return NextResponse.json({
            message: 'Subscription plan deleted successfully'
        });
    } catch (error: any) {
        console.error('Error deleting subscription plan:', error);
        return NextResponse.json(
            { error: 'Failed to delete subscription plan', details: error.message },
            { status: 500 }
        );
    }
}
