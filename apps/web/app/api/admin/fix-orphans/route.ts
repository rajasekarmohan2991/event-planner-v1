import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any) as any
        if (!session?.user) {
            return NextResponse.json({ error: 'Auth required' }, { status: 401 })
        }

        const tenantId = session.user.currentTenantId
        if (!tenantId) {
            return NextResponse.json({ error: 'No current tenant in session' }, { status: 400 })
        }

        // Find events with null tenantId created by this user (or all if super admin)
        // Since we don't track creatorId cleanly in all cases, we might default to ALL null tenantId events
        // if the user is a super admin.
        const userRole = session.user.role

        let updatedCount = 0

        if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
            const result = await prisma.event.updateMany({
                where: {
                    tenantId: null
                },
                data: {
                    tenantId: tenantId
                }
            })
            updatedCount = result.count
        }

        return NextResponse.json({
            success: true,
            message: `Linked ${updatedCount} orphan events to tenant ${tenantId}`,
            updatedCount
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    return POST(req)
}
