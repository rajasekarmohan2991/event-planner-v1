import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ensureSchema } from '@/lib/ensure-schema';

export const dynamic = 'force-dynamic';

// PATCH /api/super-admin/companies/[id]/status - Update company status (enable/disable)
export async function PATCH(
    req: NextRequest,
    context: any
) {
    const params = context.params instanceof Promise ? await context.params : context.params;

    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { status } = body; // 'ACTIVE' or 'DISABLED'

        if (!status || !['ACTIVE', 'DISABLED'].includes(status)) {
            return NextResponse.json({
                error: 'Invalid status. Must be ACTIVE or DISABLED'
            }, { status: 400 });
        }

        if (!params || !params.id) {
            return NextResponse.json({ error: 'Missing company ID' }, { status: 400 });
        }

        // Check if company exists first
        const company = await prisma.tenant.findUnique({
            where: { id: params.id },
            select: { id: true, name: true, slug: true, status: true }
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Prevent disabling super-admin tenant
        if (company.slug === 'super-admin' && status === 'DISABLED') {
            return NextResponse.json({
                error: 'Cannot disable the super-admin tenant'
            }, { status: 400 });
        }

        // Update status using Prisma with fallback
        let updatedCompany;
        try {
            updatedCompany = await prisma.tenant.update({
                where: { id: params.id },
                data: { status }
            });
        } catch (updateError) {
            console.warn('Prisma update failed, trying raw SQL fallback:', updateError);
            // Fallback to raw SQL if Prisma schema is out of sync
            await prisma.$executeRawUnsafe(
                `UPDATE tenants SET status = $1 WHERE id = $2`,
                status,
                params.id
            );
            // Fetch updated record to return
            updatedCompany = await prisma.tenant.findUnique({
                where: { id: params.id }
            });
        }

        console.log(`Company ${company.name} status changed to ${status} by ${user.email}`);

        return NextResponse.json({
            success: true,
            message: `Company "${company.name}" ${status === 'ACTIVE' ? 'enabled' : 'disabled'} successfully`,
            company: updatedCompany
        });
    } catch (error: any) {
        console.error('Failed to update company status:', error);

        // Auto-heal if column/table missing
        if (error.message?.includes('column') || error.message?.includes('exist') || error.code === 'P2010' || error.code === '42703') {
            try {
                console.log('Running self-healing for company status update...');
                await ensureSchema();
                return NextResponse.json({ message: 'System updated. Please try again.' }, { status: 503 });
            } catch (e) {
                console.error('Self-healing failed:', e);
            }
        }

        return NextResponse.json({
            error: 'Failed to update company status',
            details: error.message
        }, { status: 500 });
    }
}
