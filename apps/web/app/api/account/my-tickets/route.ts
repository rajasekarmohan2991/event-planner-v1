import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any)?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = (session as any).user.email as string | undefined
    const userId = (session as any).user.id as bigint | undefined

    const regs = await prisma.registration.findMany({
      where: {
        OR: [
          email ? { email } : undefined,
          userId ? { userId } : undefined,
        ].filter(Boolean) as any,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ registrations: regs })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load tickets' }, { status: 500 })
  }
}
