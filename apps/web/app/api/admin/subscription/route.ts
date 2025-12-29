import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get tenant/company for the user
        const tenantMember = await prisma.tenantMember.findFirst({
            where: { userId: session.user.id },
            include: { tenant: true }
        });

        if (!tenantMember) {
            return NextResponse.json(
                { error: 'No tenant found' },
                { status: 404 }
            );
        }

        const tenant = tenantMember.tenant;

        // Get usage stats
        const eventsCount = await prisma.event.count({
            where: { tenantId: tenant.id }
        });

        const usersCount = await prisma.tenantMember.count({
            where: { tenantId: tenant.id }
        });

        // Calculate storage (simplified - you may want to implement actual storage tracking)
        const storageUsed = 0.5; // GB - placeholder

        return NextResponse.json({
            plan: tenant.plan || 'FREE',
            status: tenant.status || 'ACTIVE',
            nextBillingDate: tenant.subscriptionEndsAt,
            usage: {
                events: eventsCount,
                users: usersCount,
                storage: storageUsed
            }
        });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json(
            { error: 'Failed to fetch subscription data' },
            { status: 500 }
        );
    }
}
