import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.role || String(session.user.role) !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
  const total = await prisma.tenant.count()
  return NextResponse.json({ total })
}
