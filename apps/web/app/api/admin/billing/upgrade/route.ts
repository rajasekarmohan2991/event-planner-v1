import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: {
                plan: plan,
                status: 'ACTIVE', // Ensure active if upgraded
                subscriptionStartedAt: new Date(),
                // Mock subscription end date (1 year)
                subscriptionEndsAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            }
        })

        return NextResponse.json({
            message: 'Plan upgraded successfully',
            tenant: updatedTenant
        })

    } catch (error: any) {
        console.error('Upgrade failed:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
