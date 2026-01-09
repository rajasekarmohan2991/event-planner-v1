import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// DELETE /api/super-admin/companies/[id]/delete - Delete a company
export async function DELETE(
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
        console.log(`Super Admin ${user.email} attempting to delete company: ${params.id}`);

        // Check if company exists
        const company = await prisma.tenant.findUnique({
            where: { id: params.id },
            select: { 
                id: true, 
                name: true, 
                slug: true,
                _count: {
                    select: {
                        events: true,
                        members: true
                    }
                }
            }
        });

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Prevent deletion of super-admin tenant
        if (company.slug === 'super-admin') {
            return NextResponse.json({ 
                error: 'Cannot delete the super-admin tenant' 
            }, { status: 400 });
        }

        console.log(`Deleting company: ${company.name} (${company.id})`);
        console.log(`Company has ${company._count.events} events and ${company._count.members} members`);

        // Delete the company (cascade will handle related records)
        await prisma.tenant.delete({
            where: { id: params.id }
        });

        console.log(`Successfully deleted company: ${company.name}`);

        return NextResponse.json({ 
            success: true, 
            message: `Company "${company.name}" deleted successfully`,
            deletedCompany: {
                id: company.id,
                name: company.name,
                eventsDeleted: company._count.events,
                membersRemoved: company._count.members
            }
        });
    } catch (error: any) {
        console.error('Failed to delete company:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta
        });
        
        return NextResponse.json({ 
            error: 'Failed to delete company', 
            details: error.message 
        }, { status: 500 });
    }
}
