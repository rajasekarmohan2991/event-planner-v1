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

        const { tenantId, plan } = await req.json()

        if (!tenantId || !plan) {
            return NextResponse.json({ message: 'Tenant ID and Plan are required' }, { status: 400 })
        }

        // Fetch tenant details using Prisma Client for robustness
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                billingEmail: true,
                plan: true,
                slug: true
            }
        });

        if (!tenant) {
            return NextResponse.json({ message: 'Tenant not found' }, { status: 404 })
        }

        const oldPlan = tenant.plan;
        const subscriptionEndsAt = new Date();
        subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);

        // Update the tenant - using prisma.update is safer than raw SQL
        let updatedTenant;
        try {
            updatedTenant = await prisma.tenant.update({
                where: { id: tenantId },
                data: {
                    plan: plan,
                    status: 'ACTIVE',
                    subscriptionEndsAt: subscriptionEndsAt
                }
            });
        } catch (updateError: any) {
            console.warn('Standard update failed, trying minimal update...', updateError.message);
            // Fallback for missing subscriptionEndsAt column
            updatedTenant = await prisma.tenant.update({
                where: { id: tenantId },
                data: {
                    plan: plan,
                    status: 'ACTIVE'
                }
            });
        }

        // Determine who to notify
        let recipientEmail = tenant.billingEmail;

        if (!recipientEmail) {
            // Fallback: look for an admin/owner member
            const adminMember = await prisma.tenantMember.findFirst({
                where: {
                    tenantId: tenantId,
                    role: { in: ['OWNER', 'TENANT_ADMIN', 'ADMIN'] }
                },
                include: { user: { select: { email: true } } }
            });
            recipientEmail = adminMember?.user?.email || null;
        }

        // Send email notification
        if (recipientEmail) {
            try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
                const emailResponse = await fetch(`${appUrl}/api/email/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: recipientEmail,
                        subject: `Subscription Plan Updated - ${tenant.name}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                                <div style="background: linear-gradient(to right, #7c3aed, #4f46e5); padding: 30px; text-align: center;">
                                    <h1 style="color: white; margin: 0; font-size: 24px;">Plan Updated Successfully</h1>
                                </div>
                                <div style="padding: 30px; color: #374151;">
                                    <p style="font-size: 16px;">Hello,</p>
                                    <p>Your company subscription plan has been successfully updated by the platform administrator.</p>
                                    
                                    <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #7c3aed;">
                                        <table style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Company</td>
                                                <td style="padding: 8px 0; color: #111827; font-weight: 600;">${tenant.name}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Previous Plan</td>
                                                <td style="padding: 8px 0; color: #111827;">${oldPlan || 'FREE'}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">New Plan</td>
                                                <td style="padding: 8px 0; color: #7c3aed; font-weight: bold; font-size: 18px;">${plan}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Renewal Date</td>
                                                <td style="padding: 8px 0; color: #111827;">${subscriptionEndsAt.toLocaleDateString()}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    
                                    <p>You can now access all features included in your new plan. Log in to your dashboard to see the changes.</p>
                                    
                                    <div style="text-align: center; margin-top: 30px;">
                                        <a href="${appUrl}/signin" style="background: #7c3aed; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to Dashboard</a>
                                    </div>
                                </div>
                                <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                                    This is an automated notification. Please do not reply to this email.
                                </div>
                            </div>
                        `
                    })
                });

                if (!emailResponse.ok) {
                    console.error('Failed to send email notification:', await emailResponse.text());
                }
            } catch (emailError) {
                console.error('Email notification error:', emailError);
            }
        }

        return NextResponse.json({
            message: 'Plan upgraded successfully.',
            tenant: updatedTenant
        })

    } catch (error: any) {
        console.error('Upgrade failed:', error)
        return NextResponse.json({ message: 'Failed to update plan details', details: error.message }, { status: 500 })
    }
}
