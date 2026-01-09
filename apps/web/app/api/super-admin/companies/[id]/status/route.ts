import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH /api/super-admin/companies/[id]/status - Update company status (enable/disable)
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    const params = 'then' in context.params ? await context.params : context.params;
    
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

        // Check if company exists
        const companies: any[] = await prisma.$queryRawUnsafe(`
            SELECT id, name, slug FROM tenants WHERE id = $1
        `, params.id);

        if (companies.length === 0) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const company = companies[0];

        // Prevent disabling super-admin tenant
        if (company.slug === 'super-admin' && status === 'DISABLED') {
            return NextResponse.json({ 
                error: 'Cannot disable the super-admin tenant' 
            }, { status: 400 });
        }

        // Update status
        await prisma.$executeRawUnsafe(`
            UPDATE tenants SET status = $1, updated_at = NOW() WHERE id = $2
        `, status, params.id);

        console.log(`Company ${company.name} status changed to ${status} by ${user.email}`);

        return NextResponse.json({ 
            success: true, 
            message: `Company "${company.name}" ${status === 'ACTIVE' ? 'enabled' : 'disabled'} successfully`,
            company: {
                id: company.id,
                name: company.name,
                status
            }
        });
    } catch (error: any) {
        console.error('Failed to update company status:', error);
        return NextResponse.json({ 
            error: 'Failed to update company status', 
            details: error.message 
        }, { status: 500 });
    }
}
