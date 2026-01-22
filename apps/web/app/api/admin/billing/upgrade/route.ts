import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { tenantId, plan, paymentMethodId } = await req.json()

        if (!tenantId || !plan) {
            return NextResponse.json({ message: 'Tenant ID and Plan are required' }, { status: 400 })
        }

        // Update the tenant's plan
        // In a real scenario, this would interact with Stripe/Razorpay using paymentMethodId
        const subscriptionEndsAt = new Date();
        subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);

        // Only update columns that exist in the tenants table
        try {
            await prisma.$executeRaw`
                UPDATE tenants 
                SET 
                    subscription_plan = ${plan},
                    status = 'ACTIVE',
                    subscription_ends_at = ${subscriptionEndsAt},
                    updated_at = NOW()
                WHERE id = ${tenantId}
            `;
        } catch (updateError: any) {
            // If subscription_ends_at doesn't exist, try without it
            if (updateError.message?.includes('subscription_ends_at')) {
                await prisma.$executeRaw`
                    UPDATE tenants 
                    SET 
                        subscription_plan = ${plan},
                        status = 'ACTIVE',
                        updated_at = NOW()
                    WHERE id = ${tenantId}
                `;
            } else {
                throw updateError;
            }
        }

        const updatedTenant = await prisma.$queryRaw<any[]>`
            SELECT * FROM tenants WHERE id = ${tenantId}
        `;

        return NextResponse.json({
            message: 'Plan upgraded successfully',
            tenant: updatedTenant[0]
        })

    } catch (error: any) {
        console.error('Upgrade failed:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
