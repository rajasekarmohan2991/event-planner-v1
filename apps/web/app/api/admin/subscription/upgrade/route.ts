import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { planId, interval } = await request.json();

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

        // Plan limits mapping
        const planLimits: Record<string, { maxEvents: number; maxUsers: number; maxStorage: number }> = {
            free: { maxEvents: 10, maxUsers: 5, maxStorage: 1 },
            starter: { maxEvents: 50, maxUsers: 15, maxStorage: 10 },
            professional: { maxEvents: -1, maxUsers: 50, maxStorage: 100 },
            enterprise: { maxEvents: -1, maxUsers: -1, maxStorage: -1 }
        };

        const limits = planLimits[planId.toLowerCase()] || planLimits.free;

        // Update tenant subscription
        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantMember.tenantId },
            data: {
                plan: planId.toUpperCase(),
                maxEvents: limits.maxEvents,
                maxUsers: limits.maxUsers,
                maxStorage: limits.maxStorage * 1024, // Convert GB to MB
                subscriptionStartedAt: new Date(),
                subscriptionEndsAt: interval === 'yearly'
                    ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        // In a real app, you would integrate with a payment provider (Stripe, etc.)
        // and return a checkout URL. For now, we'll just update the plan directly.

        return NextResponse.json({
            success: true,
            plan: updatedTenant.plan,
            message: 'Subscription updated successfully'
            // checkoutUrl: 'https://checkout.stripe.com/...' // Would be returned in production
        });
    } catch (error) {
        console.error('Error upgrading subscription:', error);
        return NextResponse.json(
            { error: 'Failed to upgrade subscription' },
            { status: 500 }
        );
    }
}
