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
    if (!(session as any)?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = (session as any).user;
    if (user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 });
    }

    try {
        console.log(`Super Admin ${user.email} attempting to delete company: ${params.id}`);

        // Check if company exists using raw SQL
        const companies: any[] = await prisma.$queryRawUnsafe(`
            SELECT id, name, slug FROM tenants WHERE id = $1
        `, params.id);

        if (companies.length === 0) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const company = companies[0];

        // Prevent deletion of super-admin tenant
        if (company.slug === 'super-admin') {
            return NextResponse.json({
                error: 'Cannot delete the super-admin tenant'
            }, { status: 400 });
        }

        // Get counts
        const eventCount: any[] = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as count FROM events WHERE tenant_id = $1
        `, params.id);
        const memberCount: any[] = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as count FROM tenant_members WHERE tenant_id = $1
        `, params.id);

        const eventsDeleted = parseInt(eventCount[0]?.count || '0');
        const membersRemoved = parseInt(memberCount[0]?.count || '0');

        console.log(`Deleting company: ${company.name} (${company.id})`);
        console.log(`Company has ${eventsDeleted} events and ${membersRemoved} members`);

        // Delete related records first (manual cascade)
        // Some of these might fail if table doesn't exist, so we wrap in try-catch blocks or ignore
        const tablesToDelete = [
            'module_access',
            'module_access_matrix',
            'tax_structure_history',
            'tax_structures',
            'tenant_members',
            'invoices',
            'subscriptions',
            'payments',
            'company_settings'
        ];

        for (const table of tablesToDelete) {
            try {
                await prisma.$executeRawUnsafe(`DELETE FROM "${table}" WHERE tenant_id = $1`, params.id);
            } catch (e) {
                // Ignore if table doesn't exist or column missing
                console.log(`Skipping delete for table ${table} (might not exist or no tenant_id)`);
            }
        }

        // Delete event-related records first to avoid FK constraints
        // We find all event IDs for this tenant first
        const events: any[] = await prisma.$queryRawUnsafe(`SELECT id FROM events WHERE tenant_id = $1`, params.id);

        if (events.length > 0) {
            const eventIds = events.map((e: any) => e.id);
            // Delete in chunks or just use IN clause (assuming not huge number of events for a deleted company)
            // For very large sets, this should be batched, but valid for typical usage here.

            // 1. Delete dependent tables for these events
            // Note: using explicit loops or IN clauses with raw SQL

            // Need to format IDs for SQL IN clause safe string
            const idList = eventIds.map((id: any) => `'${id}'`).join(',');

            if (idList) {
                try {
                    await prisma.$executeRawUnsafe(`DELETE FROM event_role_assignments WHERE event_id IN (${idList})`);
                    await prisma.$executeRawUnsafe(`DELETE FROM registrations WHERE event_id IN (${idList})`);
                    await prisma.$executeRawUnsafe(`DELETE FROM tickets WHERE event_id IN (${idList})`);
                    await prisma.$executeRawUnsafe(`DELETE FROM sessions WHERE event_id IN (${idList})`);
                } catch (childError) {
                    console.warn('Error deleting event children:', childError);
                }
            }
        }

        // Delete events (this will cascade to registrations, etc. via database FK if configured, or fail)
        // We attempt to delete events manually just in case
        try {
            await prisma.$executeRawUnsafe(`DELETE FROM events WHERE tenant_id = $1`, params.id);
        } catch (e) {
            console.warn('Error deleting events:', e);
        }

        // Finally delete the tenant
        await prisma.$executeRawUnsafe(`DELETE FROM tenants WHERE id = $1`, params.id);

        console.log(`Successfully deleted company: ${company.name}`);

        return NextResponse.json({
            success: true,
            message: `Company "${company.name}" deleted successfully`,
            deletedCompany: {
                id: company.id,
                name: company.name,
                eventsDeleted,
                membersRemoved
            }
        });
    } catch (error: any) {
        console.error('Failed to delete company:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });

        return NextResponse.json({
            error: 'Failed to delete company',
            details: error.message
        }, { status: 500 });
    }
}
