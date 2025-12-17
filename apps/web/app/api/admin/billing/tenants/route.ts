import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        billingEmail: true,
        subscriptionEndsAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tenants })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
