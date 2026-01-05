import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
            where: { userId: BigInt(session.user.id) },
            include: { tenant: true }
        });

        // If no tenant found, return default free plan data
        if (!tenantMember || !tenantMember.tenant) {
            console.log('No tenant found for user:', session.user.id);
            return NextResponse.json({
                plan: 'FREE',
                status: 'ACTIVE',
                nextBillingDate: null,
                usage: {
                    events: 0,
                    users: 1,
                    storage: 0
                }
            });
        }

        const tenant = tenantMember.tenant;

        // Get usage stats
        let eventsCount = 0;
        let usersCount = 1;

        try {
            eventsCount = await prisma.event.count({
                where: { tenantId: tenant.id }
            });
        } catch (err) {
            console.error('Error counting events:', err);
        }

        try {
            usersCount = await prisma.tenantMember.count({
                where: { tenantId: tenant.id }
            });
        } catch (err) {
            console.error('Error counting users:', err);
        }

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
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');

        // Return a fallback response instead of error
        return NextResponse.json({
            plan: 'FREE',
            status: 'ACTIVE',
            nextBillingDate: null,
            usage: {
                events: 0,
                users: 1,
                storage: 0
            }
        });
    }
}
