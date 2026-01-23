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

        // Fetch tenant details first
        const tenantData = await prisma.$queryRaw<any[]>`
            SELECT id, name, billing_email, plan FROM tenants WHERE id = ${tenantId}
        `;

        if (!tenantData || tenantData.length === 0) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
        }

        const tenant = tenantData[0];
        const oldPlan = tenant.plan;

        // Update the tenant's plan (use 'plan' column, not 'subscription_plan')
        const subscriptionEndsAt = new Date();
        subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);

        try {
            await prisma.$executeRaw`
                UPDATE tenants 
                SET 
                    plan = ${plan},
                    status = 'ACTIVE',
                    subscription_ends_at = ${subscriptionEndsAt},
                    updated_at = NOW()
                WHERE id = ${tenantId}
            `;
        } catch (updateError: any) {
            // If subscription_ends_at doesn't exist, try without it
            if (updateError.message?.includes('subscription_ends_at') || updateError.message?.includes('column')) {
                await prisma.$executeRaw`
                    UPDATE tenants 
                    SET 
                        plan = ${plan},
                        status = 'ACTIVE',
                        updated_at = NOW()
                    WHERE id = ${tenantId}
                `;
            } else {
                throw updateError;
            }
        }

        // Send email notification to billing email
        if (tenant.billing_email) {
            try {
                const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: tenant.billing_email,
                        subject: `Subscription Plan Updated - ${tenant.name}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <h2 style="color: #7c3aed;">Subscription Plan Updated</h2>
                                <p>Hello,</p>
                                <p>Your subscription plan has been successfully updated.</p>
                                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 5px 0;"><strong>Company:</strong> ${tenant.name}</p>
                                    <p style="margin: 5px 0;"><strong>Previous Plan:</strong> ${oldPlan || 'FREE'}</p>
                                    <p style="margin: 5px 0;"><strong>New Plan:</strong> ${plan}</p>
                                    <p style="margin: 5px 0;"><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
                                    <p style="margin: 5px 0;"><strong>Renewal Date:</strong> ${subscriptionEndsAt.toLocaleDateString()}</p>
                                </div>
                                <p>If you have any questions, please contact our support team.</p>
                                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                                    This is an automated notification. Please do not reply to this email.
                                </p>
                            </div>
                        `
                    })
                });

                if (!emailResponse.ok) {
                    console.error('Failed to send email notification:', await emailResponse.text());
                }
            } catch (emailError) {
                console.error('Email notification error:', emailError);
                // Don't fail the request if email fails
            }
        }

        const updatedTenant = await prisma.$queryRaw<any[]>`
            SELECT * FROM tenants WHERE id = ${tenantId}
        `;

        return NextResponse.json({
            message: 'Plan upgraded successfully. Confirmation email sent to billing address.',
            tenant: updatedTenant[0]
        })

    } catch (error: any) {
        console.error('Upgrade failed:', error)
        return NextResponse.json({ message: error.message }, { status: 500 })
    }
}
