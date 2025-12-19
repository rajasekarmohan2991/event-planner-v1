import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any) as any

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        // Get user from database
        const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                currentTenantId: true,
                emailVerified: true,
            }
        })

        // Get tenant memberships
        let tenantMemberships = []
        if (dbUser) {
            tenantMemberships = await prisma.tenantMember.findMany({
                where: { userId: dbUser.id },
                select: {
                    tenantId: true,
                    role: true,
                    status: true,
                    tenant: {
                        select: {
                            name: true,
                            slug: true,
                        }
                    }
                }
            })
        }

        return NextResponse.json({
            session: {
                user: session.user,
                accessToken: session.accessToken ? 'Present' : 'Missing',
            },
            database: {
                user: dbUser ? {
                    ...dbUser,
                    id: String(dbUser.id),
                } : null,
                tenantMemberships: tenantMemberships.map(tm => ({
                    ...tm,
                    userId: undefined, // Remove for clarity
                }))
            },
            diagnosis: {
                isAuthenticated: !!session,
                hasRole: !!session?.user?.role,
                sessionRole: session?.user?.role,
                dbRole: dbUser?.role,
                rolesMatch: session?.user?.role === dbUser?.role,
                isSuperAdmin: session?.user?.role === 'SUPER_ADMIN' || dbUser?.role === 'SUPER_ADMIN',
            }
        })
    } catch (error: any) {
        console.error('Debug API error:', error)
        return NextResponse.json({
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
